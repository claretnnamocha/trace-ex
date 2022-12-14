import bip32Factory, { BIP32Interface } from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import ecPairFactory, { ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";

const bip32 = bip32Factory(ecc);
const ECPair = ecPairFactory(ecc);

const PSBTValidator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer
): boolean => {
  return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
};

export const NETWORK = ({
  testnet = false,
}: {
  testnet: boolean;
}): bitcoin.Network => {
  return testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
};

export const generateAccountWithMnemonic = ({
  mnemonic,
  path,
  network,
}: {
  mnemonic: string;
  path: string;
  network: bitcoin.Network;
}): BIP32Interface => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, network);
  return root.derivePath(path);
};

export const generateAddressWithMnemonic = ({
  mnemonic,
  path,
  network,
}: {
  mnemonic: string;
  path: string;
  network: bitcoin.Network;
}): bitcoin.Payment => {
  const account = generateAccountWithMnemonic({ mnemonic, path, network });
  return bitcoin.payments.p2wpkh({ pubkey: account.publicKey, network });
};

export const generateKeyPairWithMnemonic = ({
  mnemonic,
  path,
  network,
}: {
  mnemonic: string;
  path: string;
  network: bitcoin.Network;
}): ECPairInterface => {
  const account = generateAccountWithMnemonic({ mnemonic, path, network });
  const wif = account.toWIF();
  return ECPair.fromWIF(wif, network);
};

export const addPSBTInputs = ({
  psbt,
  utxos,
}: {
  psbt: bitcoin.Psbt;
  utxos: any[];
}): bitcoin.Psbt => {
  const newPSBT = psbt.clone();

  for (let index = 0; index < utxos.length; index += 1) {
    const utxo = utxos[index];
    newPSBT.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: utxo.nonWitnessUtxo,
    });
  }
  return newPSBT;
};

export const signPSBTInputsWithMnemonic = ({
  psbt,
  utxos,
  mnemonic,
  network,
}: {
  psbt: bitcoin.Psbt;
  utxos: any[];
  mnemonic: string;
  network: bitcoin.Network;
}) => {
  const newPSBT = psbt.clone();

  for (let index = 0; index < utxos.length; index += 1) {
    const utxo = utxos[index];

    const { path } = utxo;

    const keyPair = generateKeyPairWithMnemonic({
      path,
      mnemonic,
      network,
    });

    newPSBT.signInput(index, keyPair);
  }
  newPSBT.validateSignaturesOfAllInputs(PSBTValidator);

  return newPSBT;
};

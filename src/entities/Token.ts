import { Address, BigInt } from "@graphprotocol/graph-ts";
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO, NULL_CALL_RESULT_VALUE } from "const";

import { ERC20 } from "../../generated/LendingFactory/ERC20";
import { ERC20NameBytes } from "../../generated/LendingFactory/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/LendingFactory/ERC20SymbolBytes";
import { Token } from "../../generated/schema";

export function getToken(address: Address): Token {
  let token = Token.load(address.toHexString());

  if (token === null) {
    // const factory = getFactory();
    // factory.tokenCount = factory.tokenCount.plus(BigInt.fromI32(1));
    // factory.save();

    token = new Token(address.toHexString());
    // token.factory = factory.id;
    token.symbol = getSymbol(address);
    token.name = getName(address);
    token.totalSupply = getTotalSupply(address);
    const decimals = getDecimals(address);

    // TODO: Does this ever happen?
    // if (decimals === null) {
    //   log.warning("Demicals for token {} was null", [address.toHexString()]);
    //   return null;
    // }

    token.decimals = decimals;

    token.derivedETH = BIG_DECIMAL_ZERO;
    token.tradeVolume = BIG_DECIMAL_ZERO;
    token.tradeVolumeUSD = BIG_DECIMAL_ZERO;
    token.untrackedVolumeUSD = BIG_DECIMAL_ZERO;
    token.totalLiquidity = BIG_DECIMAL_ZERO;
    token.txCount = BIG_INT_ZERO;

    token.save();
  }

  return token as Token;
}

export function getSymbol(address: Address): string {
  const contract = ERC20.bind(address);
  const contractSymbolBytes = ERC20SymbolBytes.bind(address);

  // try types string and bytes32 for symbol
  let symbolValue = "unknown";
  const symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    const symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (symbolResultBytes.value.toHex() != NULL_CALL_RESULT_VALUE) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue;
}

export function getName(address: Address): string {
  const contract = ERC20.bind(address);
  const contractNameBytes = ERC20NameBytes.bind(address);

  // try types string and bytes32 for name
  let nameValue = "unknown";
  const nameResult = contract.try_name();
  if (nameResult.reverted) {
    const nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (nameResultBytes.value.toHex() != NULL_CALL_RESULT_VALUE) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}

export function getTotalSupply(address: Address): BigInt {
  const contract = ERC20.bind(address);
  const totalSupplyResult = contract.try_totalSupply();
  if (!totalSupplyResult.reverted) {
    return totalSupplyResult.value;
  }
  return BIG_INT_ZERO;
}

/**
 * Token decimals
 * @param address ERC20 token
 * @returns decimals
 */
export function getDecimals(address: Address): BigInt {
  const contract = ERC20.bind(address);

  // try types uint8 for decimals
  let decimalValue = 0;
  const decimalResult = contract.try_decimals();

  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
  }

  return BigInt.fromI32(decimalValue as i32);
}

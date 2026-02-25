import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";

describe("x1devtoolkit", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("is configured for the correct network", () => {
    const endpoint = provider.connection.rpcEndpoint;
    console.log(`  Connected to: ${endpoint}`);
    assert.ok(
      endpoint.includes("x1.xyz") || endpoint.includes("localhost"),
      "Should be connected to X1 or localnet"
    );
  });
});

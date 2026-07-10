import { sdk } from './sdk'

/**
 * Explicit no-op uninit handler.
 *
 * StartOS 0.4.0-beta.9 sometimes fails updates with
 * "TypeError: this.abi.uninit is not a function" when a package relies on the
 * SDK default. Exporting a concrete empty uninit function avoids that path.
 */
export const uninit = sdk.setupUninit()

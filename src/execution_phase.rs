use anyhow::Result;
use seda_sdk_rs::{Process, elog, log, proxy_http_fetch};

/**
 * Executes the data request phase within the SEDA network.
 * This phase is responsible for fetching non-deterministic data (e.g., price of an asset pair)
 * from an external source such as a price feed API. The input specifies the asset pair to fetch.
 */
pub fn execution_phase() -> Result<()> {
    let coingecko_id = String::from_utf8(Process::get_inputs())?;

    let response = proxy_http_fetch(
        format!("http://testnet-2.proxy.testnet.seda.xyz/proxy/{}", coingecko_id),
        None,
        None,
    );

    // Check if the HTTP request was successfully fulfilled.
    if !response.is_ok() {
        // Handle the case where the HTTP request failed or was rejected.
        elog!(
            "HTTP Response was rejected: {} - {}",
            response.status,
            String::from_utf8(response.bytes)?
        );

        // Report the failure to the SEDA network with an error code of 1.
        Process::error("Error while fetching price feed".as_bytes());

        return Ok(());
    }

    // Parse the API response as defined earlier.
    let price = serde_json::from_slice::<f32>(&response.bytes)?;

    log!("Fetched price: {}", price);

    let result = (price * 1000000f32) as u128;
    log!("Reporting: {}", result);

    // Report the successful result back to the SEDA network.
    Process::success(&result.to_le_bytes());

    Ok(())
}

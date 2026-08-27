# Call the challenge API from the browser

For this technical exercise, the application calls the supplied product API directly from the browser and attaches the required `x-api-key` header. The challenge distributes this key to candidates, so we accept that it is visible in the client bundle to keep the solution focused and avoid a proxy or backend-for-frontend; this decision must be revisited before using secret credentials or deploying a production service.

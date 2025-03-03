<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700">Invoice From</label>
  <input
    type="text"
    value={companyInfo.details || ""}
    readOnly={true}
    disabled={true}
    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm cursor-not-allowed"
  />
  <p className="text-xs text-gray-500 mt-1">
    {companyInfo.details 
      ? `Connected as: ${companyInfo.details}` 
      : "Waiting for connection from Yodl..."}
  </p>
</div> 
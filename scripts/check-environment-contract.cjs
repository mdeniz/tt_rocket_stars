const contracts = {
  development: { required: [], defaults: ['API_ENV', 'API_CORS_ORIGINS', 'AUTH_BASE_URL', 'AUTH_LOCAL_INVITATION_CODE'] },
  test: { required: [], defaults: ['API_ENV', 'API_CORS_ORIGINS', 'AUTH_BASE_URL', 'AUTH_LOCAL_INVITATION_CODE'] },
  staging: { required: ['AUTH_SECRET'], defaults: ['API_ENV', 'API_CORS_ORIGINS', 'AUTH_BASE_URL'] },
  production: { required: ['AUTH_SECRET'], defaults: ['API_ENV', 'API_CORS_ORIGINS', 'AUTH_BASE_URL'] },
};

function validateEnvironment(input = {}) {
  const environment = input.API_ENV ?? 'development';
  const contract = contracts[environment];
  if (!contract) throw new Error('API_ENV must be development, test, staging, or production.');
  for (const key of contract.required) if (typeof input[key] !== 'string' || input[key].length < 32) throw new Error(`${key} is required for ${environment}.`);
  if (typeof input.API_CORS_ORIGINS === 'string' && input.API_CORS_ORIGINS.split(',').some(origin => !/^https?:\/\//.test(origin.trim()))) throw new Error('API_CORS_ORIGINS must contain HTTP origins.');
  return { environment, required: contract.required, defaults: contract.defaults };
}

if (require.main === module) {
  try { console.log(JSON.stringify(validateEnvironment(process.env))); } catch (error) { console.error(error.message); process.exit(1); }
}
module.exports = { contracts, validateEnvironment };

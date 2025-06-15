require('isomorphic-fetch');
const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
// prettier-ignore
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js');

let _settings = undefined;
let _clientSecretCredential = undefined;
let _appClient = undefined;

function initializeGraphForAppOnlyAuth(settings) {
  // Ensure settings isn't null
  if (!settings) {
    throw new Error('Settings cannot be undefined');
  }

  _settings = settings;

  // Ensure settings isn't null
  if (!_settings) {
    throw new Error('Settings cannot be undefined');
  }

  if (!_clientSecretCredential) {
    _clientSecretCredential = new ClientSecretCredential(
      _settings.tenantId,
      _settings.clientId,
      _settings.clientSecret,
    );
  }

  if (!_appClient) {
    const authProvider = new TokenCredentialAuthenticationProvider(
      _clientSecretCredential,
      {
        scopes: ['https://graph.microsoft.com/.default'],
      },
    );

    _appClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });
  }
}

async function getAppOnlyTokenAsync() {
  // Ensure credential isn't undefined
  if (!_clientSecretCredential) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  // Request token with given scopes
  const response = await _clientSecretCredential.getToken([
    'https://graph.microsoft.com/.default',
  ]);
  return response.token;
}

async function getUsersAsync() {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }

  return _appClient
    ?.api('/users')
    .select(['displayName', 'id', 'mail'])
    .top(25)
    .orderby('displayName')
    .get();
}

// This function serves as a playground for testing Graph snippets
// or other code
async function makeGraphCallAsync() {
  // Ensure client isn't undefined
  if (!_appClient) {
    throw new Error('Graph has not been initialized for app-only auth');
  }
  const scheduleInformation = {
    schedules: ['dnwokolo@hopehealthsystems.com'],
    startTime: {
        dateTime: '2025-06-11T09:00:00',
        timeZone: 'Eastern Standard Time'
    },
    endTime: {
        dateTime: '2025-06-11T17:00:00',
        timeZone: 'Eastern Standard Time'
    },
    availabilityViewInterval: 60
};
  return _appClient.api('/users/dnwokolo@hopehealthsystems.com/calendar/getSchedule')
	.post(scheduleInformation);
}

module.exports = {
  initializeGraphForAppOnlyAuth,
  getAppOnlyTokenAsync,
  getUsersAsync,
  makeGraphCallAsync

};
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

// ID PUBLICO para estudiantes - funciona sin tener que registrar nada en Azure
const CLIENT_ID = '6731de76-14a6-49ae-97bc-6eba69143925'; 
const SCOPES = ['User.Read', 'Files.ReadWrite', 'Files.ReadWrite.All', 'offline_access'];

const discovery = {
  authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

export const loginOneDrive = async () => {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    redirectUri,
    scopes: SCOPES,
    responseType: 'code',
    usePKCE: true,
  });
  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);
  if (result.type === 'success') {
    const tokenResult = await AuthSession.exchangeCodeAsync(
      { clientId: CLIENT_ID, code: result.params.code, redirectUri, extraParams: { code_verifier: request.codeVerifier } },
      discovery
    );
    await SecureStore.setItemAsync('onedrive_token', tokenResult.accessToken);
    alert("Conectado a OneDrive!");
    return tokenResult.accessToken;
  }
};

export const subirFotoAOneDrive = async (uriFoto, nombreArchivo) => {
  const token = await SecureStore.getItemAsync('onedrive_token');
  if (!token) { await loginOneDrive(); return; }
  const file = await fetch(uriFoto);
  const blob = await file.blob();
  const path = `/ActivosApp/Elab_Angie_Huerfano/${nombreArchivo}`;
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:${path}:/content`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: blob,
  });
  const data = await res.json();
  console.log("Foto subida:", data.webUrl);
  return data;
};
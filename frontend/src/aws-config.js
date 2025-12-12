import { Amplify } from "aws-amplify";

const useMockAuth =
  (import.meta.env.VITE_USE_MOCK_AUTH || "false").toLowerCase() === "true";

const amplifyConfig = {
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_AWS_REGION,
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_WEB_CLIENT_ID,
      loginWith: {
        username: true,
        email: true,
      },
    },
  },
};

if (!useMockAuth) {
  Amplify.configure(amplifyConfig);
}

export { Amplify, useMockAuth };
export default amplifyConfig;

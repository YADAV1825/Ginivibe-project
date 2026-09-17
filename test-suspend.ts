import { AdminAuth } from '../frontend-web/app/core/services/AdminAuth';

async function main() {
  try {
    const login = await AdminAuth.login({ email: 'admin@ginivibe.com', password: 'supersecret' });
    console.log('Login successful:', login.token);
    
    const orgs = await AdminAuth.getOrganizations(login.token);
    if (orgs.length > 0) {
      console.log('Suspending org:', orgs[0].id);
      const res = await AdminAuth.suspendOrganization(login.token, orgs[0].id);
      console.log('Suspend result:', res);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}
main();

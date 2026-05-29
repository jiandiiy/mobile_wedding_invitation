import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

async function main() {
  const email = process.argv[2];

  if (!email) {
    throw new Error('관리자 이메일을 인자로 전달해 주세요. 예: npm run set-admin -- admin@example.com');
  }

  const serviceAccountPath = resolve(process.cwd(), 'service-account.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

  initializeApp({
    credential: cert(serviceAccount),
  });

  const user = await getAuth().getUserByEmail(email);

  await getAuth().setCustomUserClaims(user.uid, {
    admin: true,
  });

  console.log(`${email} 계정에 admin 권한을 부여했습니다.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
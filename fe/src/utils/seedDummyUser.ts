import { getUsers, saveUsers } from './authStorage';

export function seedDummyUser() {
  const users = getUsers();

  if (users.length > 0) return;

  saveUsers([
    {
      id: 'test123',
      password: '1234',
      phone: '01012345678',
      carrier: 'skt',
      name: '홍길동',
      birth: '010101',
      genderDigit: '3',
      nickname: '길동이',
    },
  ]);
}

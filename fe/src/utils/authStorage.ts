import type { User } from '../types/auth';

const USERS_KEY = 'sidepick_users';
const CURRENT_USER_KEY = 'sidepick_current_user';

export function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);

  if (!data) return [];

  try {
    return JSON.parse(data) as User[];
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function addUser(user: User) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function findUserById(id: string) {
  const users = getUsers();
  return users.find((user) => user.id === id);
}

export function loginUser(id: string, password: string) {
  const users = getUsers();

  const matchedUser = users.find(
    (user) => user.id === id && user.password === password,
  );

  if (!matchedUser) {
    return null;
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(matchedUser));
  return matchedUser;
}

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);

  if (!data) return null;

  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

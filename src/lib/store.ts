import { User, Test, Question, TestResult } from './types';

const IS_BROWSER = typeof window !== 'undefined';

export const store = {
  getUsers: (): User[] => {
    if (!IS_BROWSER) return [];
    const users = localStorage.getItem('ocr_users');
    return users ? JSON.parse(users) : [];
  },
  saveUser: (user: User) => {
    const users = store.getUsers();
    localStorage.setItem('ocr_users', JSON.stringify([...users, user]));
  },
  updateUser: (updatedUser: User) => {
    const users = store.getUsers();
    localStorage.setItem('ocr_users', JSON.stringify(users.map(u => u.id === updatedUser.id ? updatedUser : u)));
  },
  getTests: (): Test[] => {
    if (!IS_BROWSER) return [];
    const tests = localStorage.getItem('ocr_tests');
    return tests ? JSON.parse(tests) : [];
  },
  saveTest: (test: Test) => {
    const tests = store.getTests();
    localStorage.setItem('ocr_tests', JSON.stringify([...tests, test]));
  },
  updateTest: (test: Test) => {
    const tests = store.getTests();
    localStorage.setItem('ocr_tests', JSON.stringify(tests.map(t => t.id === test.id ? test : t)));
  },
  getResults: (): TestResult[] => {
    if (!IS_BROWSER) return [];
    const results = localStorage.getItem('ocr_results');
    return results ? JSON.parse(results) : [];
  },
  saveResult: (result: TestResult) => {
    const results = store.getResults();
    localStorage.setItem('ocr_results', JSON.stringify([...results, result]));
  },
  getCurrentUser: (): User | null => {
    if (!IS_BROWSER) return null;
    const user = localStorage.getItem('ocr_current_user');
    return user ? JSON.parse(user) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('ocr_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ocr_current_user');
    }
  }
};

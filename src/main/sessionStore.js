const store = {
    currentUser: null,
    isAuthenticated: false
};

module.exports = {
    setUser(userData) {
        store.currentUser = userData;
        store.isAuthenticated = true;
    },
    clearUser() {
        store.currentUser = null;
        store.isAuthenticated = false;
    },
    getUser() {
        return store.currentUser;
    },
    isAuthenticated() {
        return store.isAuthenticated;
    }
};
const store = {
    currentUser: null,
    isAuthenticated: false,
    serverPort: null,
};

const setUser = (userData) => {
    store.currentUser = userData;
    store.isAuthenticated = true;
};

const clearUser = () => {
    store.currentUser = null;
    store.isAuthenticated = false;
};

const getUser = () => {
    return store.currentUser;
};

const isAuthenticated = () => {
    return store.isAuthenticated;
};

const setPort = (port) => {
    store.serverPort = port;
    console.log('Puerto guardado en store:', port);
};

const getPort = () => {
    console.log('Obteniendo puerto del store:', store.serverPort);
    return store.serverPort;
};

module.exports = { setUser, clearUser, getUser, isAuthenticated, setPort, getPort };

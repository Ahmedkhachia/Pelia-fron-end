

 const Authentification = {
    isAuthenticated: false,
    authenticate(cb) {
      Authentification.isAuthenticated = true;
      setTimeout(cb, 100); // fake async
    },
    signout(cb) {
      Authentification.isAuthenticated = false;
      setTimeout(cb, 100);
    }
  };
  
  
  export default Authentification
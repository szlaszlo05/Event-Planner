export const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.redirect('/auth/login?message=Please+login+to+perform+this+action&status=error');
};

export const isUser = (req, res, next) => {
  if (req.role == false) {
    next();
  } else {
    res.redirect("/admin/dashboard");
  }
};

export const isAdmin = (req, res, next) => {
  if (req.role == true) {
    next();
  } else {
    res.redirect("/home");
  }
};

//
// Middleware that assumes there's a req.model
// object, and renders the given template name
// passing that model as the template parameter.
//

function renderTemplate(templateName) {
  return function (req, res) {
    res.render(templateName, req.model);
  }
}

function renderModel(modelLoader, templateName) {
  templateRenderer = renderTemplate(templateName);
  return function (req, res) {
    modelLoader(req, res, function () {
      templateRenderer(req, res);
    })
  };
}

exports.template = renderTemplate;
exports.model = renderModel;

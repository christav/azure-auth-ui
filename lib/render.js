//
// Middleware that assumes there's a req.model
// object, and renders the given template name
// passing that model as the template parameter.
//

'use strict';

function renderTemplate(templateName) {
  return function (req, res) {
    res.render(templateName, req.model);
  }
}

function renderModel(modelLoader, templateName) {
  var templateRenderer = renderTemplate(templateName);
  return function (req, res) {
    modelLoader(req, res, function () {
      templateRenderer(req, res);
    })
  };
}

exports.template = renderTemplate;
exports.model = renderModel;

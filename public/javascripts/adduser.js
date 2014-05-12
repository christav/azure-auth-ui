//
// Some code to make the add user form more interactive
//
(function () {
  var organizationSelect;
  var organizationDescription;

  function onChange() {
    var key = organizationSelect.selectedOptions[0].value;
    organizationDescription.textContent = orgs[key].description;
  }

  function onReady() {
    organizationSelect = document.getElementById('organizationSelect');
    organizationDescription = document.getElementById('orgDescription');

    organizationSelect.addEventListener('change', onChange);
    onChange();
  }

  document.addEventListener('DOMContentLoaded', onReady);
}());

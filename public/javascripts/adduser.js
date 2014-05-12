//
// Some code to make the add user form more interactive
//

$(function () {

  $('#organizationSelect').change(function () {
    var key = $('#organizationSelect').val();
    $('#orgDescription').text(orgs[key].description);
  }).change();

  function onUserChanged() {
    var disabled = ($('#githubUser').val() === "") || ($('#microsoftAlias').val() === "");
    if (disabled) {
      $('#addUserButton').attr('disabled', 'disabled');
    } else {
      $('#addUserButton').removeAttr('disabled');
    }
  }

  onUserChanged();

  $('#githubUser').on('change keypress paste input', onUserChanged);
  $('#microsoftAlias').on('change keypress paste input', onUserChanged);
});

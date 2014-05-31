//
// Some code to make the add user form more interactive
//

(function () {

  function AddUserViewModel(orgData) {
    this.organizations = orgData;
    this.selectedOrganization = ko.observable();
  }

  $(function () {
    ko.applyBindings(new AddUserViewModel(orgs));
  });
}());

// $(function () {

//   // Handle organization selection - update description
//   $('#organizationSelect').change(function () {
//     var key = $('#organizationSelect').val();
//     $('#orgDescription').text(orgs[key].description);
//   }).change();

//   // Handle enable/disable of the add user button
//   function onUserChanged() {
//     var disabled = ($('#githubUser').val() === "") || ($('#microsoftAlias').val() === "");
//     if (disabled) {
//       $('#addUserButton').attr('disabled', 'disabled');
//     } else {
//       $('#addUserButton').removeAttr('disabled');
//     }
//   }
//   onUserChanged();

//   $('#githubUser').on('change keypress paste input', onUserChanged);
//   $('#microsoftAlias').on('change keypress paste input', onUserChanged);

//   // Handle pressing the add-user button
//   $('#addUserButton').click(function () {
//     var rowNum = $('.users-to-add-group .row').length - 1;
//     var newRow = $('#userLineTemplate').clone();
//     newRow.attr('id', 'userRow' + rowNum);
//     $('input:first', newRow).val($('#githubUser').val()).attr('readonly', 'readonly');
//     $('input:last', newRow).val($('#microsoftAlias').val()).attr('readonly', 'readonly');

//     newRow.insertBefore($('.users-to-add-group .row:last'));

//     $('#githubUser').val('');
//     $('#microsoftAlias').val('');
//     $('#githubUser').focus();
//   });

//   // handling pressing the remove buttons
//   $('.users-to-add-group').on('click', '.remove-user-btn', function () {
//     var row = $(this).parents('.row').remove();
//   });
// });

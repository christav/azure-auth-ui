//
// Some code to make the add user form more interactive
//

(function () {

  function AddUserViewModel(orgData, userData) {
    var self = this;

    self.organizations = orgData;
    self.selectedOrganization = ko.observable();
    self.orgToUpdate = ko.computed(function () {
      if (self.selectedOrganization()) {
        return self.selectedOrganization().key;
      }
    });

    self.users = ko.observableArray(userData.map(function (user) {
      user.parent = self;
      return user;
    }));

    self.githubUserToAdd = ko.observable();
    self.microsoftAliasToAdd = ko.observable();

    self.removeUser = function (user) {
      self.users.remove(user);
    };

    self.addUser = function () {
      self.users.push({
        githubUser: self.githubUserToAdd(),
        microsoftAlias: self.microsoftAliasToAdd(),
        parent: self
      });
      self.githubUserToAdd('');
      self.microsoftAliasToAdd('');
      $('#githubUser').focus();
    };

    self.enableAdd = ko.computed(function () {
      return self.githubUserToAdd() && self.microsoftAliasToAdd();
    });
  }

  $(function () {
    ko.applyBindings(new AddUserViewModel(orgs, users));
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

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

    self.users = ko.observableArray(userData);

    self.githubUserToAdd = ko.observable();
    self.microsoftAliasToAdd = ko.observable();

    self.removeUser = function (user) {
      self.users.remove(user);
    };

    self.addUser = function () {
      self.users.push({
        githubUser: self.githubUserToAdd(),
        microsoftAlias: self.microsoftAliasToAdd()
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

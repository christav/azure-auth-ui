//
// Model representing the processing for adding a user.
//

var _ = require('lodash');

//
// Create a view model for a get request
//
function emptyReadModel(githubClient) {
	return githubClient.getOrgFile()
		.then(function (orgFile)) {
			var orgs = orgFile.getOrganizations();

			return {
				orgs: orgs,
				selectedOrg: orgs[0].key,
				users: [],
				errors: []
			};
		}
}

function fromPost(githubClient, postBody, resultHandlers) {

}

function validatePostData(orgFile, postBody) {
	var errors = [];
	if (!postBody.orgToUpdate) {
		errors.push('No organization given');
	} else if (!_.has(orgFile.getOrgMap(), postBody.orgToUpdate)) {
		errors.push('Organization given does not exist');
	}

	var githubUsers = postBody.githubUser;
	var microsoftAliases = postBody.microsoftAlias;

	if (!githubUser || !microsoftAlias) {
		errors.push('Missing user data');
	}

	if (githubUsers && microsoftAlias && (githubUsers.length !== microsoftAliases.length)) {
		errors.push('User names and aliases do not match up!');
	}

	return errors;
}

_.extend(exports, {
	emptyReadModel: emptyReadModel,
	fromPost: fromPost
});
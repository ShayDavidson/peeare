require("colors");
const Octokat = require("octokat");
const ora = require("ora");
const flatten = require("lodash.flatten");
const sortBy = require("lodash.sortby");
const maxBy = require("lodash.maxby");
const print = console.log;
const { realLength, formatText } = require("./utils");

const MAX_PRS_TO_FETCH = 100;

function fetchAndDisplayPullRequests(githubHostname, githubAccessToken, repos = [], users = []) {
  const spinner = ora();
  spinner.start(`Fetching PRs...`);
  const githubRootURL = `https://${githubHostname}/api/v3`;
  const githubClient = new Octokat({
    token: githubAccessToken,
    rootURL: githubRootURL
  });
  fetchPullRequests(githubClient, githubRootURL, repos)
    .then(prs => {
      spinner.stop();
      return prs;
    })
    .then(prs => flatten(prs).map(pr => extractPullRequestInfo(pr)))
    .then(prsInfo => prsInfo.filter(prInfo => users.includes(prInfo.author)))
    .then(relevantPRs => {
      if (relevantPRs.length == 0) return [];

      const maxPRTitle = realLength(maxBy(relevantPRs, pr => realLength(pr.title)).title);
      const maxPRAuthor = maxBy(relevantPRs, pr => pr.author.length).author.length;
      return sortBy(relevantPRs, "author").map(pr => formatPullRequest(pr, maxPRTitle, maxPRAuthor));
    })
    .then(formattedPRs => {
      if (formattedPRs.length == 0) {
        print("Could not find matching PRs.".yellow);
      } else {
        formattedPRs.forEach(pr => print(pr));
      }
    })
    .catch(err => {
      spinner.stop();
      print("Oops! Something went wrong:".red);
      print(err.stack.red);
    });
}

function fetchPullRequests(githubClient, githubRootURL, repos) {
  return Promise.all(
    repos.map(repo => {
      return fetchPullRequest(githubClient, githubRootURL, repo);
    })
  );
}

function fetchPullRequest(githubClient, githubRootURL, repo) {
  return githubClient
    .fromUrl(`${githubRootURL}/repos/${repo}/pulls`)
    .fetch({ state: "open", per_page: MAX_PRS_TO_FETCH })
    .then(result => result.items);
}

function formatPullRequest(pr, maxPRTitle, maxPRAuthor) {
  return `- ${formatText(pr.title, maxPRTitle, "·").green} by ${formatText(pr.author, maxPRAuthor, " ").yellow} - ${pr.url.cyan}`;
}

function extractPullRequestInfo(pr) {
  return {
    author: pr.user.login,
    url: pr.htmlUrl,
    title: pr.title
  };
}

module.exports = {
  run(data) {
    let valid = true;
    if (data.repos.length == 0) {
      print("You need to add at least one repo for query. Use `peeare add repos <repo>`.".red);
      valid = false;
    }
    if (data.users.length == 0) {
      print("You need to add at least one user for query. Use `peeare add users <user>`.".red);
      valid = false;
    }

    if (valid) fetchAndDisplayPullRequests(data.hostname, data.at, data.repos, data.users);
  }
};

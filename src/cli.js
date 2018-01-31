#!/usr/bin/env node

const peeare = require("./peeare");
const Sly = require("./sly");

Sly({
  name: "peeare",
  commands: {
    default: {
      description: "display all your team's pull request.",
      execute: peeare.run
    }
  },
  props: {
    at: {
      description: "Github access token",
      required: true
    },
    hostname: {
      description: "Github hostname",
      default: "github.com"
    }
  },
  lists: {
    repos: {
      description: "Github repos"
    },
    users: {
      description: "Github users"
    }
  }
});

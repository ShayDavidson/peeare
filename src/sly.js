require("colors");
const assert = require("assert");
// const prompt = require("node-ask").prompt;
const print = console.log;
const maxBy = require("lodash.maxby");
const { formatText } = require("./utils");

const RESERVED_COMMANDS = ["help", "reset", "set", "get", "list", "add", "remove"];
const VALID_CONFIG_KEYS = ["name", "commands", "props", "lists"];
const VALID_COMMAND_CONFIG_KEYS = ["description", "execute", "args"];
const VALID_PROPS_CONFIG_KEYS = ["description", "required", "default"];
const VALID_LISTS_CONFIG_KEYS = ["description"];

function Sly(config) {
  const store = require("dot-file-config")(config.name);
  const [, , ...args] = process.argv;
  const [command, key, value] = args;

  if (validateConfig(config)) {
    persistDefaultValues(config, store);
    if (command === undefined) {
      executeCommand("default", config, store);
    } else if (Object.keys(config.commands).includes(command)) {
      const [, ...restOfArgs] = args;
      executeCommand(command, config, store, restOfArgs);
    } else if (command === "help") {
      printHelpMessage(config);
    } else if (command === "reset") {
      handleReset(config, store);
    } else if (command === "get") {
      handleGet(config, store, key);
    } else if (command === "set") {
      handleSet(config, store, key, value);
    } else if (command === "list") {
      handleList(config, store, key);
    } else if (command === "add") {
      handleAdd(config, store, key, value);
    } else if (command === "remove") {
      handleRemove(config, store, key, value);
    } else {
      printInvalidCommandMessage(config);
    }
  }
}

function validateConfig(config) {
  try {
    const { name, commands, props, lists } = config;

    Object.keys(config).forEach(key => assert.ok(VALID_CONFIG_KEYS.includes(key), `'${key}' is not a supported configuration property.`));

    assert.ok(name, "No 'name' on Sly configuration object.".red);

    assert.ok(commands, "No 'commands' objedt on Sly configuration object.".red);
    assert.ok(commands.default, "No 'default' command on Sly 'commands' config object.".red);

    Object.keys(commands || {}).forEach(command => {
      const commandObject = commands[command];
      assert.ok(!RESERVED_COMMANDS.includes(command), `'${command}' is a reserved command.`);
      Object.keys(commandObject).forEach(key =>
        assert.ok(VALID_COMMAND_CONFIG_KEYS.includes(key), `'${key}' is not a supported 'commands' configuration property.`)
      );
      assert.ok(commandObject.execute, `No 'execute' function on your '${command}' command.`);
      assert.ok(commandObject.description, `No 'description' string on your '${command}' command.`);
    });

    Object.keys(props || []).forEach(prop => {
      const propObject = props[prop];
      Object.keys(propObject).forEach(key =>
        assert.ok(VALID_PROPS_CONFIG_KEYS.includes(key), `'${key}' is not a supported 'props' configuration property.`)
      );
      assert.ok(propObject.description, `No 'description' property on your '${prop}' prop configuration.`);
    });

    Object.keys(lists || []).forEach(list => {
      const listObject = lists[list];
      Object.keys(listObject).forEach(key =>
        assert.ok(VALID_LISTS_CONFIG_KEYS.includes(key), `'${key}' is not a supported 'lists' configuration property.`)
      );
      assert.ok(listObject.description, `No 'description' property on your '${list}' list configuration.`);
    });

    return true;
  } catch (e) {
    print(`Sly configuration is invalid: ${e.message}`.red);
    return false;
  }
}

function persistDefaultValues(config, store) {
  Object.keys(config.props || []).forEach(prop => {
    const defaultValue = config.props[prop].default;
    if (!store.data[prop] && defaultValue) {
      store.data[prop] = defaultValue;
    }
  });
  store.save();
}

function executeCommand(command, config, store, args) {
  config.commands[command].execute(sanitizedStoreData(config, store.data), args);
}

function sanitizedStoreData(config, store) {
  const clonedStore = Object.assign(store);
  Object.keys(config.lists || []).forEach(key => {
    clonedStore[key] = Object.keys(store[key]);
  });
  return clonedStore;
}

function formatCommand(string) {
  return `'${string.cyan}'`;
}

function printHelpMessage(config) {
  const { name, commands, props, lists } = config;
  const messages = [];

  Object.keys(commands).forEach(command => {
    const { description, args } = commands[command];
    const argsString = args ? args.map(arg => `<${arg}>`).join(" ") : "";
    messages.push({ command: command === "default" ? name : `${name} ${command} ${argsString}`, help: description });
  });

  messages.push({ command: `${name} reset`, help: "Resets your local config." });

  Object.keys(props).forEach(prop => {
    const { description } = props[prop];
    const defaultValue = props[prop].default;
    const defaultValueString = defaultValue ? `Defaults to ${defaultValue}.` : "";
    messages.push({ command: `${name} get ${prop}`, help: `Shows the ${description} from your local config. ${defaultValueString}` });
    messages.push({ command: `${name} set ${prop} <${prop}>`, help: `Sets <${prop}> as the ${description} in your local config.` });
  });

  Object.keys(lists).forEach(list => {
    const { description } = lists[list];
    messages.push({
      command: `${name} list ${list}`,
      help: `Lists all the ${description} in your local config.`
    });
    messages.push({
      command: `${name} add ${list} <${list}>`,
      help: `Adds <${list}> (command separated) to the ${description} you want to track in your local config.`
    });
    messages.push({
      command: `${name} remove ${list} <${list}>`,
      help: `Removes <${list}> (command separated) from the ${description} you want to track in your local config.`
    });
  });
  const maxCommandLength = maxBy(messages, message => message.command.length).command.length;
  messages.forEach(message => {
    print(`   - ${formatText(message.command, maxCommandLength, " ").cyan} - ${message.help}`);
  });
}

function printInvalidCommandMessage({ name }) {
  print(`Unknown command. type ${formatCommand(`${name} help`)} to list all available commands.`);
}

function handleReset({ name }, store) {
  store.data = {};
  store.save();
  print(`Your ${name} configuration is reset.`);
}

function handleGet({ name, props }, store, key) {
  const prop = Object.keys(props || {}).find(prop => prop === key);
  if (prop) {
    const propObject = props[prop];
    if (store.data[key]) {
      print(`Your ${name}'s ${propObject.description} is: ${store.data[key].cyan}`);
    } else {
      print(`You haven't set your ${propObject.description} yet. Run ${formatCommand(`${name} set ${prop} <${prop}>`)}.`);
    }
  } else {
    print(`${key} is not a valid property.`.red);
  }
}

function handleSet({ props }, store, key, value) {
  const prop = Object.keys(props || {}).find(prop => prop === key);
  if (prop) {
    store.data[key] = value;
    store.save();
  } else {
    print(`'${key}' is not a valid property.`.red);
  }
}

function handleList({ name, lists }, store, key) {
  const list = Object.keys(lists || {}).find(list => list === key);
  if (list) {
    const listObject = lists[list];
    if (store.data[key]) {
      const formattedList = Object.keys(store.data[key]).join(", ");
      print(`Your ${name}'s ${listObject.description} are: ${formattedList.cyan}.`);
    } else {
      print(`You haven't added any ${listObject.description} yet. Run ${formatCommand(`${name} add ${list} <${list}, comma separated>`)}.`);
    }
  } else {
    print(`'${key}' is not a valid property.`.red);
  }
}

function handleAdd({ lists }, store, key, value) {
  const list = Object.keys(lists || {}).find(list => list === key);
  if (list) {
    const values = value.split(",");
    store.data[key] = store.data[key] || {};
    values.forEach(value => {
      store.data[key][value] = true;
    });
    store.save();
  } else {
    print(`'${key}' is not a valid property.`.red);
  }
}

function handleRemove({ lists }, store, key, value) {
  const list = Object.keys(lists || {}).find(list => list === key);
  if (list) {
    const values = value.split(",");
    store.data[key] = store.data[key] || {};
    values.forEach(value => {
      delete store.data[key][value];
    });
    store.save();
  } else {
    print(`'${key}' is not a valid property.`.red);
  }
}

module.exports = Sly;

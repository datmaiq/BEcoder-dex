const Joi = require("joi");
const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];
const createPokemonSchema = Joi.object().keys({
  name: Joi.string().required(),
  id: Joi.number().required(),
  types: Joi.array()
    .items(Joi.string().valid(...pokemonTypes))
    .min(1)
    .max(2),
  url: Joi.string().required(),
  evolution: Joi.string(),
});
module.exports = { createPokemonSchema };

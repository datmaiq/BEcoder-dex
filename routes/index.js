var express = require("express");
var router = express.Router();
const fs = require("fs");

const { parse } = require("csv-parse");
const { createPokemonSchema } = require("./schema.js");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.status(200).send("Welcome to DatMai");
});

router.get("/pokemons", function (req, res) {
  const data = [];
  let count = 0;
  fs.createReadStream("./archive/pokemon.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", (row) => {
      count++;
      data.push({
        id: count,
        name: row[0],
        types: [row[1].toLowerCase(), row[2].toLowerCase()],
        url: `http://localhost:8000/${row[0]}.png`,
      });
    })
    .on("end", () => {
      const { page, limit, search } = req.query;
      console.log(page);
      let pageNum = 1;
      let limitPage = 19;
      if (!page || page < 1) {
        page = pageNum;
      }
      if (!limit || limit < 1) {
        limit = limitPage;
      }
      let offset = limit * (page - 1);
      let result = {};
      if (search && search.trim() !== "") {
        const pokemonSearch = data.filter(
          (e) =>
            e?.name.toLowerCase().includes(search.toLowerCase()) ||
            e?.types.includes(search)
        );
        result = {
          data: pokemonSearch.slice(offset, offset + limit),
          totalPokemons: pokemonSearch.length,
        };
      } else {
        result = {
          data: data.slice(offset, offset + limit),
          totalPokemons: data.length,
        };
      }
      res.status(200).send(result);
    });
});

router.get("/pokemons/:id", function (req, res, next) {
  const data = [];

  let count = 0;
  fs.createReadStream("./archive/pokemon.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", (row) => {
      count++;
      let typeTemp = [];
      row[1].toLowerCase() === "" ? "" : typeTemp.push(row[1].toLowerCase());
      row[2].toLowerCase() === "" ? "" : typeTemp.push(row[2].toLowerCase());
      data.push({
        id: count,
        name: row[0],
        types: [...typeTemp],
        url: `http://localhost:8000/${row[0]}.png`,
      });
    })
    .on("end", () => {
      const pokemonId = data.findIndex((e) => e.id == req.params.id);

      let result = {};
      if (pokemonId != -1) {
        switch (pokemonId) {
          case 0:
            result = {
              data: {
                previousPokemon: data[data.length - 1],
                pokemon: data[pokemonId],
                nextPokemon: data[pokemonId + 1],
              },
            };
            break;
          case data.length - 1:
            result = {
              data: {
                previousPokemon: data[pokemonId - 1],
                pokemon: data[pokemonId],
                nextPokemon: data[0],
              },
            };
            break;
          default:
            result = {
              data: {
                previousPokemon: data[pokemonId - 1],
                pokemon: data[pokemonId],
                nextPokemon: data[0],
              },
            };
        }
      } else {
        result = { data: [] };
      }
      res.status(200).send(result);
    });
});

router.post("/pokemons", function (req, res, next) {
  const { value, error } = createPokemonSchema.validate(req.body);
  if (error) {
    res.status(400).json(error.message);
  }
  // if (!req.body.name || req.body.name == "") {
  //   res.status(400).send("Error Name");
  //   return;
  // }
  // if (!req.body.id || req.body.id == 0) {
  //   res.status(404).send("Error ID");
  //   return;
  // }
  // if (
  //   !req.body.types ||
  //   !Array.isArray(req.body.types) ||
  //   req.body.types.length > 2 ||
  //   req.body.types.length == 0
  // ) {
  //   res.status(400).send("Error Types");
  //   return;
  // } else {
  //   const result = req.body.types.map((e) => pokemonTypes.includes(e));
  //   if (result.some((e) => e == false)) {
  //     res.status(400).send("Invalid Types");
  //     return;
  //   }
  // }
  // if (!req.body.url || req.body.url == "") {
  //   res.status(400).send("Error URL");
  //   return;
  // }

  let data = [];
  let count = 0;
  fs.createReadStream("./archive/pokemon.csv")
    .pipe(parse({ delimiter: ",", from_line: 1 }))
    .on("data", (row) => {
      count++;
      data.push({
        id: count,
        name: row[0],
        types: [row[1], row[2]],
        url: `http://localhost:8000/${row[0]}.png`,
      });
    })
    .on("end", () => {
      console.log(data);
      const pokemonExists = data.some(
        (pokemon) =>
          pokemon.name.toLowerCase() === req.body.name.toLowerCase() ||
          pokemon.id === req.body.id
      );

      if (pokemonExists) {
        res.status(409).send("The Pokémon already exists.");
      } else {
        const newPokemon = {
          id: value.id,
          name: value.name,
          types: value.types,
          evolution: value.evolution,
          url: value.url,
        };

        const csvContent = `\n${newPokemon.name},${newPokemon.types[0]},${
          newPokemon.types[1] || ""
        },${newPokemon.evolution || ""}`;

        fs.appendFile("archive/pokemon.csv", csvContent, (err) => {
          if (err) {
            console.error(err);
            res.status(500).send("Error writing to CSV file");
          } else {
            console.log("...Done");
            res.status(201).send("Create pokemon success");
          }
        });
      }
    });
});

router.delete("/pokemons/:id", function (req, res, next) {
  const id = parseInt(req.params.id);
  console.log(req.params);
  let data = [];
  let count = 0;

  // Read the CSV file
  fs.createReadStream("./archive/pokemon.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", (row) => {
      count++;
      data.push({
        id: count,
        name: row[0],
        types: [row[1], row[2]],
        evolution: row[3],
        url: `http://localhost:8000/${row[0]}.png`,
      });
    })
    .on("end", () => {
      // Find the index of the Pokémon to delete
      const pokemonIndex = data.findIndex((pokemon) => pokemon.id === id);
      console.log(pokemonIndex);
      if (pokemonIndex === -1) {
        // Pokémon not found
        res.status(404).send("Pokémon not found");
      } else {
        // Remove the Pokémon from the data array
        data.splice(pokemonIndex, 1);

        // Write the updated data back to the CSV file
        const csvContent = data
          .map((pokemon) => [
            pokemon.name,
            pokemon.types[0],
            pokemon.types[1] || "",
            pokemon.evolution || "",
          ])
          .join("\n");

        fs.writeFile("archive/pokemon.csv", csvContent, (err) => {
          if (err) {
            console.error(err);
            res.status(500).send("Error writing to CSV file");
          } else {
            console.log("...Done");
            res.status(200).send("Pokémon deleted");
          }
        });
      }
    });
});

module.exports = router;

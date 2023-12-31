const fetch = require('node-fetch');
const fs = require('fs');
const stress_dict = JSON.parse(fs.readFileSync('server/data/compiled.json', 'utf8'));

const Word = function (word) {

    this.word = word.toLowerCase(); // forces the word to be a lower case
    this.stresses = [];
    this.syllables = [];
    this.get_info();

    this.variant = false; // if the word has multiple pronunciations

    if (this.syllables && this.syllables.length > 1) { // if there are variants

        // removes duplicate syllable counts inside the array
        let temp = [];

        let b = this.syllables.filter((v) => {

            if (temp.indexOf(v.toString()) < 0) {

                temp.push(v.toString());
                return v;

            }

        });

        this.syllables = b; // stores the new array

    }

    if (this.syllables) { // if it is a word

        // if there is only 1 variant
        if (this.syllables.length === 1 && Array.isArray(this.syllables)) {

            // set the array to equal the only element
            this.syllables = this.syllables[0];

        } else { // if there are multiple variants

            this.variant = true; // sets that this word is a variant

        }

    }

    if (this.stresses && this.stresses.length > 1) { // if there are variant stresses

        // removes duplicate stresses inside the array
        let temp = [];

        let b = this.stresses.filter((v) => {

            if (temp.indexOf(v.toString()) < 0) {

                temp.push(v.toString());
                return v;

            }

        });

        this.stresses = b; // stores the new array

    }

    if (this.stresses) { // if it is a word

        // if there is only 1 variant or the word is only 1 syllable
        if ((this.stresses.length === 1 && Array.isArray(this.stresses)) || this.syllables == 1) {

            // sets the array to equal the only element
            this.stresses = this.stresses[0];

        } else { // if there are multiple variants

            this.variant = true; // sets that this word is a variant

        }

    }

    if (this.variant) {

        //console.log(this);

    }

};
Word.prototype.get_rhymes = async function () { // gets a list of all words that rhyme with the given word

    let data = await fetch(`https://api.datamuse.com/words?rel_rhy=${this.word.toLowerCase()}`); // fetches the datamuse rhyme list for the word
    let body = await data.json();

    return body;

};
Word.prototype.check_rhymes = async function (b) { // checks if two words rhyme

    let rhymes = await this.get_rhymes(); // uses the datamuse api to get a list of words that rhyme with a

    for (let i of rhymes) { // loops through the list

        if (i.word.toLowerCase() === b.toLowerCase()) { // checks if b is included in the list

            return true;

        }

    }

    return false;

}
Word.prototype.get_info = function () {

    let up = this.word.toUpperCase();

    if (stress_dict[up]) { // checks if the word is in the stress dictionary

        let i = 1; // sets the index to check for variants
        this.stresses = [stress_dict[up].stresses]; // sets the variant of stresses
        this.syllables = [stress_dict[up].syllables]; // sets the variant of syllables

        while (stress_dict[`${up}(${i})`] !== undefined) { // adds each variant to the array

            this.stresses.push(stress_dict[`${up}(${i})`].stresses);
            this.syllables.push(stress_dict[`${up}(${i})`].syllables);
            i++; // increments to check for new variants

        }

    } else {

        // if the word was not found
        this.stresses = false;
        this.syllables = false;

    }

};

const Line = function (line) {

    this.line = line.toLowerCase();
    this.line = this.line.replace(/[`’]/g, "\'");
    this.line = this.line.replace(/[-]/g, ' ');
    this.line = this.line.replace(/[^a-zA-Z0-9 ']/g, ''); // removes all special characters
    this.line = this.line.replace(/  +/g, " "); // removes spaces bigger than 2

    this.arr = this.line.split(/[ —-]/); // splits the phrase at dashes, hyphens, and spaces

    for (let i = 0; i < this.arr.length; i++) { // loops through the lines

        if (this.arr[i].length <= 0) { // checks if any lines are blank

            this.arr.splice(i, 1); // removes blank lines

        }

    }

    for (let i = 0; i < this.arr.length; i++) { // loops through each word in the line

        this.arr[i] = new Word(this.arr[i]); // create a Word type for each word

    }

}
Line.prototype.meter_check = function (meter) {

    if (meter === undefined) {

        return [];

    }

    let only_syllables = false;

    if (meter[0] === 'x') { // if the meter doesn't matter

        only_syllables = true;

    }

    let variant_indexes = []; // the array indexes of words that have multiple pronunciations
    let cycles = 1; // the number of possible meter variations

    for (let i = 0; i < this.arr.length; i++) { // loops through all the words

        if (!this.arr[i].stresses || !this.arr[i].syllables) { // if the word is not in the stress dictionary

            return [{

                reason: 'word',
                word: this.arr[i].word

            }];

        }

        if (this.arr[i].variant) { // checks for variants


            let t;

            if (Array.isArray(this.arr[i].syllables)) { // checks to see if it has syllable variants

                t = this.arr[i].syllables.length; // adds the number of syllable variants

            } else if (Array.isArray(this.arr[i].stresses)) { // checks to see if it has stress variatns

                t = this.arr[i].stresses.length; // adds the number of stress variants

            } else {

                t = 1; // sets the number of syllable variants to 1

            }

            variant_indexes.push({ // adds the variant to the variant indexes array

                index: i,
                amount: t

            });

            cycles *= t; // multiples the times it has to run by the amount of variants

        }

    }


    let schema = []; // the pattern to calculate all possible variations
    let error_iteration;

    for (let i = 0; i < cycles; i++) { // loops through all combinations

        let vc = 0; // the index of the variant currently being used

        schema[i] = []; // intializes a blank array for each cycle of the schema

        for (let j = 0; j < variant_indexes.length; j++) { // loops through all the variants

            let a = variant_indexes[j].amount; // the amount of variants for each word with a different pronunciation
            schema[i][j] = Math.floor(i / ((Math.pow(a, j)))) % a; // fills the schema so that each column is a unique combination of every variant

        }

        let detected_meter = ''; // the meter of each pass

        for (let w of this.arr) { // loops through the words

            if (w.variant) { // if the word is a variant, use the schema

                detected_meter += w.stresses[schema[i][vc]].join('');
                vc++;

            } else {

                let expected = meter[detected_meter.length];

                // if the word is 1 syllable long
                if (w.syllables < 2 && expected) {

                    // sets the stress to fit the meter
                    detected_meter += expected;

                } else { // if the line is beyond the meter

                    detected_meter += w.stresses.join('');

                }

            }

        }

        for (let j = 0; j < detected_meter.length; j++) { // loops through the meter

            let expected = meter[detected_meter.length]; // finds what the selected meter expects

            if (detected_meter[j] === '2' && expected) { // if the stress is partial and there is a meter

                // changes the partial stress into whatever the meter dictates
                detected_meter = `${detected_meter.substring(0, j)}${expected}${detected_meter.substring(j + 1)}`;

            } else if (detected_meter[j] === '2') { // if the stress is partial but there is no meter

                // changes the partial stress into a regular stress
                detected_meter = `${detected_meter.substring(0, j)}1${detected_meter.substring(j + 1)}`;

            }

        }

        // if the detected meter matches the expected meter, or if the meter doesn't matter
        if (detected_meter === meter || (detected_meter.length === meter.length && only_syllables)) {

            return true; // return a match

        } else if (detected_meter.length === meter.length || i === 0) { // else return an error

            error_iteration = detected_meter;

        }

    }

    if (error_iteration.length !== meter.length) { // if there are too many syllables in the line

        return [{

            reason: 'count',
            allowed: meter.length,
            total: error_iteration.length

        }];

    } else { // if there is a meter error

        return [{

            reason: 'meter',
            required: meter,
            adjusted: error_iteration

        }]

    }

};
Line.prototype.rhymes_with = async function (line) {

    let last_word_a = this.arr[this.arr.length - 1];
    let last_word_b = line.arr[line.arr.length - 1]

    if (last_word_a.word === last_word_b.word) {

        return true;

    } else {

        if (!await last_word_a.check_rhymes(last_word_b.word)) {

            return {

                reason: 'rhyme',
                a: last_word_a.word,
                b: last_word_b.word

            }

        } else {

            return true;

        }

    }

};

const Poem = function (line_number, meter, rhymescheme, repeatable, meter_errors, rhyme_errors) {

    this.line_number = line_number;
    this.meter = meter;

    this.repeatable = repeatable;
    this.meter_errors = meter_errors;
    this.rhyme_errors = rhyme_errors;

    if (!Array.isArray(this.meter)) {

        this.meter = [];

        for (let i = 0; i < line_number; i++) {

            this.meter.push(meter);

        }

    } else if (this.meter.length < line_number) {

        let i = 0;
        while (this.meter.length < line_number) {

            this.meter.push(this.meter[i]);
            i++;

        }

    }

    this.rhymescheme = rhymescheme;


}
Poem.prototype.check = async function (poem) {

    let arr = poem.split('\n');
    let lines = [];

    let errors = [];
    let rhymes = {};
    let scheme_errors = {};

    for (let i = 0; i < arr.length; i++) { // loops through the lines of the poem

        let l = new Line(arr[i]);

        if (l.line.length > 0) { // if the line isn't empty

            lines.push(l);

        }

    }

    // if the poem has the wrong number of lines
    if ((lines.length !== this.line_number && !this.repeatable) || (lines.length % this.line_number > 0 && this.repeatable)) {

        errors.push({

            reason: 'line_number',
            expected: this.line_number,
            actual: lines.length

        });

    }

    for (let i = 0; i < lines.length; i++) { // loops through all the liens of the poem

        let meter = await lines[i].meter_check(this.meter[i % this.line_number]); // checks to see if the line fits the meter

        if (meter !== true) { // if there is a meter error

            for (let m of meter) { // adds the meter error to the array of errors

                m.line_number = i + 1;
                errors.push(m);

            }

        }

        if (Array.isArray(this.rhymescheme)) { // if there are different rhymescheme variations

            for (let r of this.rhymescheme) { // loops through each variation

                if (rhymes[r] === undefined) { // if the analysis of the current scheme is empty

                    rhymes[r] = {}; // intialize an empty object
                    scheme_errors[r] = []; // intialize an empty error array

                }

                if (i % this.line_number === 0 && this.repeatable) { // resets the saved rhymes if you have moved to the next verse

                    rhymes[r] = {};

                }

                if (r) {

                    if (rhymes[r][r[i % this.line_number]] === undefined) { // if the last word for that rhyme letter is undefined

                        rhymes[r][r[i % this.line_number]] = lines[i]; // sets the word


                    } else { // if the word exists

                        // check the word against the existing word
                        let does_rhyme = await lines[i].rhymes_with(rhymes[r][r[i % this.line_number]]);

                        if (does_rhyme !== true) { // if the word does not rhyme

                            scheme_errors[r].push(does_rhyme); // adds a rhyme error to the array

                        }

                    }

                }

            }

        } else {

            if (i % this.line_number === 0 && this.repeatable) { // resets the saved rhymes if you have moved to the next verse

                rhymes = {};

            }

            if (this.rhymescheme) {

                if (rhymes[this.rhymescheme[i % this.line_number]] === undefined) {

                    rhymes[this.rhymescheme[i % this.line_number]] = lines[i];

                } else {

                    let does_rhyme = await lines[i].rhymes_with(rhymes[this.rhymescheme[i % this.line_number]]);

                    if (does_rhyme !== true) {

                        errors.push(does_rhyme);

                    }

                }

            }

        }

    }

    if (Array.isArray(this.rhymescheme)) { // if the rhymescheme is an array

        let selection = false; // the rhymescheme detected

        for (let i in scheme_errors) { // loops through all the errors

            if (!selection) { // if there is no selection

                selection = scheme_errors[i]; // sets the first one as the selection

            }

            // if this rhymescheme has less errors
            if (scheme_errors[i].length < selection.length) {

                // sets a new rhyme scheme
                selection = scheme_errors[i];

            }

        }

        // adds the rhyme scheme errors to the main errors array
        for (let i of selection) {

            errors.push(i);

        }

    }

    // returns the number of lines and all the errors
    return {

        lines: lines.length,
        errors: errors
    
    };

};

function file_to_object(path) {

    var res = {};
    var a = fs.readdirSync(path);

    for (var b of a) {

        var s = fs.lstatSync(`${path}/${b}`);

        if (s.isDirectory()) {

            res[b] = file_to_object(`${path}/${b}`);

        } else {

            var json = JSON.parse(fs.readFileSync(`${path}/${b}`));
            res[json.name] = json;

        }

    }

    return res;

}


module.exports = { Word, Line, Poem, file_to_object };
const fetch = require('node-fetch');
const fs = require('fs');
const stress_dict = JSON.parse(fs.readFileSync('private/data/compiled.json', 'utf8'));

const Word = function (word) {

    this.word = word.toLowerCase();
    this.stresses = this.get_stress();
    this.syllables = this.get_syllable();

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
Word.prototype.get_stress = function () {

    let up = this.word.toUpperCase();

    if (stress_dict[up]) {

        return stress_dict[up].stresses;

    } else {

        return false;

    }

};
Word.prototype.get_syllable = function () {

    let up = this.word.toUpperCase();

    if (stress_dict[up]) {

        return stress_dict[up].syllables;

    } else {

        return false;

    }

};

const Line = function (line) {

    this.line = line.toLowerCase();
    this.line = this.line.replace(/[.,/#!$%?`^&*’;:{}=_`~()]/g, ""); // removes all special characters
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

    let allowed_syllables = meter.length;
    let total_syllables = 0;
    let real_meter = ''; // the exact meter of the line
    let adjusted_meter = ''; // the line adjusted to forgive single syllable words in an attempt to match the meter

    let errors = [];
    let word_not_found = false;
    let too_many_syllables = false;

    for (let i = 0; i < this.arr.length; i++) {

        if (this.arr[i].syllables) { // checks to make sure there is a syllable count

            total_syllables += this.arr[i].syllables; // increments the total syllables by the word amount

        } else { // if the word is not found in the meter dictionary

            errors.push({

                reason: 'word',
                word: this.arr[i].word

            });

            word_not_found = true;

        }

    }

    if (total_syllables !== allowed_syllables && !word_not_found) {

        too_many_syllables = true;

        errors.push({

            reason: 'count',
            allowed: allowed_syllables,
            total: total_syllables

        });

    }

    let current_syllable = 0; // stores the current syllable being tested

    for (let i = 0; i < this.arr.length; i++) {

        if (this.arr[i].syllables) { // checks to make sure there is a syllable count

            for (let s of this.arr[i].stresses) { // loops through the stresses

                real_meter += s; // adds the exact stress to the "real stress" string

            }

            if (this.arr[i].stresses.length <= 1) { // if there is only one syllable

                if (meter[current_syllable] !== undefined) {

                    adjusted_meter += meter[current_syllable]; // adjusts single syllable words to fit meter

                } else {

                    let s = this.arr[i].stresses[0];

                    if (s > 1) { // if the stress is a secondary stress

                        s = 1; // force primary stress

                    }

                    adjusted_meter += s; // adds the stress to the adjusted meter

                }

                current_syllable++; // increments the syllable counter

            } else {

                for (let s of this.arr[i].stresses) { // if there are multiple stresses

                    if (s > 1) { // if the stress is a secondary stress

                        if (meter[current_syllable] !== undefined) {

                            s = meter[current_syllable]; // adjusts single syllable words to fit meter

                        } else {

                            s = 1;

                        }

                    }

                    adjusted_meter += s; // adds the stress to the adjusted meter
                    current_syllable++; // increments the syllable

                }

            }

        }

    }

    if (adjusted_meter !== meter && !word_not_found && !too_many_syllables) {

        errors.push({

            reason: 'meter',
            required: meter,
            real: real_meter,
            adjusted: adjusted_meter

        });

    }

    if (errors.length <= 0) {

        return true;

    } else {

        return errors;

    }

}
Line.prototype.rhymes_with = async function (line) {

    let last_word_a = this.arr[this.arr.length - 1];
    let last_word_b = line.arr[line.arr.length - 1]

    if (last_word_a.word === last_word_b.word) {

        return true;

    } else {

        if (!await last_word_a.check_rhymes(last_word_b.word)) {

            return {
                
                type: 'rhyme',
                a: last_word_a.word,
                b: last_word_b.word

            }

        } else {

            return true;

        }

    }

};

const Poem = function (line_number, meter, rhymescheme) {

    this.line_number = line_number;
    this.meter = meter;

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

        console.log(this.meter);

    }

    this.rhymescheme = rhymescheme;

}
Poem.prototype.check = async function (poem) {

    let arr = poem.split('\n');
    let lines = [];

    let errors = [];
    let rhymes = {};

    for (let i = 0; i < arr.length; i++) { // loops through the lines of the poem

        let l = new Line(arr[i]);

        if (l.line.length > 0) { // if the line isn't empty

            lines.push(l);

        }

    }

    if (lines.length !== this.line_number) {

        errors.push({

            type: 'line_number',
            expected: this.line_number,
            actual: lines.length

        });

    }

    for (let i = 0; i < lines.length; i++) {

        let meter = await lines[i].meter_check(this.meter[i]);

        if (meter !== true) {

            for (let m of meter) {

                m.line_number = i + 1;
                errors.push(m);

            }

        }

        if (rhymes[this.rhymescheme[i]] === undefined) {

            rhymes[this.rhymescheme[i]] = lines[i];

        } else {

            let does_rhyme = await lines[i].rhymes_with(rhymes[this.rhymescheme[i]]);

            if (does_rhyme !== true) {

                errors.push(does_rhyme);

            }

        }

    }
    
    return errors;

};

module.exports = { Word, Line, Poem };
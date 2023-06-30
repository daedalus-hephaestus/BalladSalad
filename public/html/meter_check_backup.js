Line.prototype.meter_check = function (meter) {

    if (meter === undefined) {

        return [];

    }

    let allowed_syllables = meter.length;
    let total_syllables = 0;
    let real_meter = ''; // the exact meter of the line
    let adjusted_meter = ''; // the line adjusted to forgive single syllable words in an attempt to match the meter

    let errors = []; // the errors found in the line
    let word_not_found = false; // if one of the words was not in the dictionary
    let too_many_syllables = false; // if there were too many syllables in the line

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
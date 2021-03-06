const
    _ = require('../util'),
    metamodel = require('.');

/**
 * @extends metamodel.Entity
 */
class Literal extends metamodel.Entity {

    #value = '';
    #language = '';
    #datatype = _.XSD.string;

    /**
     * @param {string|boolean|number|{'@value': string, '@language'?: string, '@type'?: string}|metamodel.Literal} param 
     */
    constructor(param) {
        super();

        let
            native = !(_.is.object(param) && (('@value' in param) || (param instanceof Literal))),
            value = native ? param : (param['@value'] ?? param.value),
            language = native ? null : (param['@language'] ?? param.language),
            datatype = native ? null : (param['@type'] ?? param.type);

        if (language) {
            this.datatype = _.RDF.langString;
            this.language = language;
            this.value = value
        } else if (datatype) {
            this.datatype = datatype;
            this.value = value;
        } else if (_.is.string(value)) {
            this.datatype = _.XSD.string;
            this.value = value;
        } if (_.is.boolean(value)) {
            this.datatype = _.XSD.boolean;
            this.value = value;
        } else if (_.is.number(value)) {
            // this.datatype = _.XSD.decimal;
            this.datatype = _.is.number.integer(value) ? _.XSD.integer : _.XSD.float;
            this.value = value;
        } else if (value instanceof Date) {
            this.datatype = _.XSD.date;
            this.value = value;
        } else {
            this.value = value;
        }
    }

    /** @type {string} */
    get value() { return this.#value; }
    set value(value) {
        if (Object.isFrozen(this)) return;
        switch (this.#datatype) {
            case _.XSD.string:
            case _.RDF.langString:
                this.#value = _.parse.xsd_string(value).toString();
                break;
            case _.XSD.boolean:
                this.#value = _.parse.xsd_boolean(value).toString();
                break;
            case _.XSD.integer:
                this.#value = _.parse.xsd_integer(value).toString();
                break;
            case _.XSD.decimal:
            case _.XSD.float:
                this.#value = _.parse.xsd_decimal(value).toString();
                break;
            case _.XSD.date:
                this.#value = _.parse.xsd_date(value).toString();
                break;
            default:
                this.#value = _.parse(value).toString();
                break;
        }
    }

    /** @type {string} */
    get language() { return this.#language; }
    set language(language) {
        if (Object.isFrozen(this)) return;
        _.assert.equal(this.#datatype, _.RDF.langString);
        _.assert.string(language, _.pattern.LanguageTag);
        this.#language = language;
    }

    /** @type {string} */
    get datatype() { return this.#datatype; }
    set datatype(datatype) {
        if (Object.isFrozen(this)) return;
        if (datatype === _.RDF.langString) {
            this.#datatype = _.RDF.langString;
            this.#language = this.#language || 'en';
        } else {
            _.assert.string(datatype, _.pattern.IRI);
            this.#datatype = datatype;
            this.#language = '';
        }
    }

    /**
     * @param {metamodel.Literal} other 
     * @returns {boolean}
     */
    equals(other) {
        return super.equals(other) || other instanceof Literal
            && this.value === other.value
            && this.language === other.language
            && this.datatype === other.datatype;
    }

    /**
     * @returns {string | {'@value': string, '@language': string} | {'@value': string, '@type': string}}
     */
    toJSON() {
        switch (this.datatype) {
            case _.RDF.langString:
                return {
                    '@language': this.language,
                    '@value': this.value
                };
            case _.XSD.string:
            // return this.value;
            default:
                return {
                    '@type': this.datatype,
                    '@value': this.value
                };
        }
    }

    /**
     * @returns {boolean|number|string}
     */
    valueOf() {
        switch (this.#datatype) {
            case _.XSD.boolean:
                return this.#value === true.toString();
            case _.XSD.integer:
                return parseInt(this.#value);
            case _.XSD.decimal:
            case _.XSD.float:
                return parseFloat(this.#value);
            default:
                return this.#value;
        }
    }

}

module.exports = Literal;
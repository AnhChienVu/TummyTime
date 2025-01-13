// src/model/fragment.js

const { randomUUID } = require('crypto');
const contentType = require('content-type');

const path = require('path');

const {
  readFragment, // readFragment(ownerId, id)
  writeFragment, // writeFragment(fragment)

  readFragmentData, // readFragmentData(ownerId, id)
  writeFragmentData, // writeFragmentData(ownerId, id, buffer)

  listFragments, // listFragments(ownerId, expand = false)
  deleteFragment, // deleteFragment(ownerId, id)
} = require(path.join(__dirname, 'data', 'index.js'));

/**
 * Fragment class is built upon RAW DATA and METADATA
 * METADATA: id, ownerId, created, updated, type, size
 * RAWDATA: Buffer (binary data like text, images, etc.)
 */
class Fragment {
  // a dictionary of convertible types for each MIME type
  static #VALIDCONVERTIBLETYPES = {
    'text/plain': ['text/plain'],
    'text/markdown': ['text/markdown', 'text/html', 'text/plain'],
    'text/html': ['text/html', 'text/plain'],
    'text/csv': ['text/csv', 'text/plain', 'application/json'],
    'application/json': ['application/json', 'application/yaml', 'text/plain'],
    'application/yaml': ['application/yaml', 'text/plain'],
    'image/png': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    'image/jpeg': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    'image/webp': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    'image/avif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    'image/gif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
  };

  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (size < 0 || typeof size !== 'number') throw new Error('size must be a positive number');
    if (!Fragment.isSupportedType(type)) throw new Error(`Unsupported type: ${type}`);

    // OWNERID is user's hashed email
    this.ownerId = ownerId;

    this.id = id || randomUUID();
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId: user's hashed email
   * @param {boolean} expand: whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expanded = false) {
    try {
      return (await listFragments(ownerId, expanded)) || [];
    } catch (err) {
      throw new Error(
        `Inside byUser(), Error getting fragments for ownerId ${ownerId}: ${err.message}`
      );
    }
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId: user's hashed email
   * @param {string} id: fragment's id
   * @returns Promise<Fragment>
   */
  // read METADATA: id, ownerId, type etc.
  static async byId(ownerId, id) {
    try {
      const fragmentData = await readFragment(ownerId, id);

      if (!fragmentData) {
        throw new Error(`Fragment not found for ownerId: ${ownerId} and id: ${id}`);
      }

      // If there's metadata, create a Fragment object from it
      let retFragment = new Fragment(fragmentData);

      return retFragment;
    } catch (err) {
      throw new Error(`Fragment not found for ownerId: ${ownerId} and id: ${id}: ${err.message}`);
    }
  }

  /**
   * Delete the user's fragment DATA and METADATA for the given id
   * @param {string} ownerId: user's hashed email
   * @param {string} id: fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    try {
      const fragment = await Fragment.byId(ownerId, id);
      if (!fragment) {
        throw new Error(`Fragment not found for ownerId: ${ownerId} and id: ${id}`);
      }

      await deleteFragment(ownerId, id);
    } catch (err) {
      throw new Error(`Fragment not found for ownerId: ${ownerId} and id: ${id}: ${err.message}`);
    }
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  //save() for METADATA not RAW DATA
  async save() {
    try {
      this.updated = new Date().toISOString();

      // Save the metadata
      await writeFragment(this);
    } catch (err) {
      throw new Error(
        `Error saving fragment for ownerId: ${this.ownerId} and id: ${this.id}: ${err.message}`
      );
    }
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  // getData() for RAWDATA: Buffer
  async getData() {
    try {
      return await readFragmentData(this.ownerId, this.id);
    } catch (err) {
      throw new Error(
        `Error getting data for ownerId: ${this.ownerId} and id: ${this.id}: ${err.message}`
      );
    }
  }

  /**
   * Set the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  // setData() for RAWDATA: Buffer
  async setData(data) {
    try {
      if (!Buffer.isBuffer(data)) {
        throw new Error('Invalid data: Data must be a Buffer');
      }

      this.size = data.length;
      this.updated = new Date().toISOString();

      await writeFragment(this);

      await writeFragmentData(this.ownerId, this.id, data);
    } catch (err) {
      throw new Error(
        `Error setting data for ownerId: ${this.ownerId} and id: ${this.id}: ${err.message}`
      );
    }
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean}: true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>}: list of supported mime types
   */
  get formats() {
    // use MIME type as KEY to GET A LIST OF CONVERTIBLE TYPES in the dictionary #VALIDCONVERTIBLETYPES
    return Fragment.#VALIDCONVERTIBLETYPES[this.mimeType];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value: a Content-Type value (e.g., 'text/plain' or 'text/plain; charset=utf-8')
   * @returns {boolean}: true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    //parse the full 'text/plain; charset=utf-8' ==> { type: 'text/plain', parameters: { charset: 'utf-8' } }
    const { type } = contentType.parse(value);

    return Object.keys(Fragment.#VALIDCONVERTIBLETYPES).includes(type);
  }
}

module.exports.Fragment = Fragment;

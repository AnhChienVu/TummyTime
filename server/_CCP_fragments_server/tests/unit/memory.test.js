// tests/unit/memory.test.js

const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
} = require('../../src/model/data/memory/index.js ');

describe('Index.js functions for memory-db', () => {
  const testOwnerId = 'OwnerId1';
  const testFragmentId = 'FragmentId1';
  let testData, testFragment;

  // Each test will get its own, empty database instance
  beforeEach(() => {
    testData = '123data';

    testFragment = {
      ownerId: testOwnerId,
      id: testFragmentId,
      data: testData,
    };
  });

  test('readFragment() returns what we writeFragment() into the metadata', async () => {
    await writeFragment(testFragment);
    const result = await readFragment(testOwnerId, testFragmentId);
    expect(result).toEqual(testFragment);
  });

  test('writeFragment() and readFragment() work with Buffers', async () => {
    testData = Buffer.from([1, 2, 3]);
    testFragment.data = testData;
    await writeFragment(testFragment);
    const result = await readFragment(testOwnerId, testFragmentId);
    expect(result).toEqual(testFragment);
  });

  test('readFragment() with incorrect secondaryKey returns nothing', async () => {
    await writeFragment(testFragment);
    const result = await readFragment(testOwnerId, 'a');
    expect(result).toBe(undefined);
  });

  test('readFragment() expects string keys', () => {
    expect(async () => await readFragment()).rejects.toThrow();
    expect(async () => await readFragment(1)).rejects.toThrow();
    expect(async () => await readFragment(1, 1)).rejects.toThrow();
  });

  test('writeFragment() expects an object', () => {
    expect(async () => await writeFragment()).rejects.toThrow();
    expect(async () => await writeFragment(1)).rejects.toThrow();
    expect(async () => await writeFragment('a')).rejects.toThrow();
  });

  test('readFragmentData() returns what we writeFragmentData() into the metadata', async () => {
    await writeFragmentData(testOwnerId, testFragmentId, testData);
    const result = await readFragmentData(testOwnerId, testFragmentId);
    expect(result).toEqual(testData);
  });

  test('writeFragmentData() and readFragmentData() work with Buffers', async () => {
    testData = Buffer.from([1, 2, 3]);
    await writeFragmentData(testOwnerId, testFragmentId, testData);
    const result = await readFragmentData(testOwnerId, testFragmentId);
    expect(result).toEqual(testData);
  });

  test('readFragmentData() with incorrect secondaryKey returns nothing', async () => {
    await writeFragmentData(testOwnerId, testFragmentId, testData);
    const result = await readFragmentData(testOwnerId, 'a');
    expect(result).toBe(undefined);
  });

  test('readFragmentData() expects string keys', () => {
    expect(async () => await readFragmentData()).rejects.toThrow();
    expect(async () => await readFragmentData(1)).rejects.toThrow();
    expect(async () => await readFragmentData(1, 1)).rejects.toThrow();
  });

  test('writeFragmentData() expects string keys in the first two arguments', () => {
    expect(async () => await writeFragmentData()).rejects.toThrow();
    expect(async () => await writeFragmentData(1)).rejects.toThrow();
    expect(async () => await writeFragmentData(1, 1)).rejects.toThrow();
  });
});

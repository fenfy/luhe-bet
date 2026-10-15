import { test } from 'node:test'
import assert from 'node:assert/strict'
import { numbersOf, previewItems, topKeys, formatMoney } from '../src/utils/bet.js'

const options = {
  zodiacs: [
    { name: '马', numbers: ['01', '13', '25', '37', '49'] },
    { name: '牛', numbers: ['06', '18', '30', '42'] }
  ],
  numbers: [{ number: '01' }, { number: '06' }],
  waves: [{ name: '红波', numbers: ['01', '02', '07', '08', '12', '13', '18', '19', '23', '24', '29', '30', '34', '35', '40', '45', '46'] }]
}

test('numbersOf 按投注方式取号码', () => {
  assert.equal(numbersOf(options, '1', '马').length, 5)
  assert.deepEqual(numbersOf(options, '2', '01'), ['01'])
  assert.deepEqual(numbersOf(options, '2', '99'), [])
  assert.equal(numbersOf(options, '3', '红波').length, 17)
})

test('previewItems 校验能否均分到每个号码', () => {
  const p = previewItems(options, '1', ['马', '牛'], 100)
  assert.deepEqual(p[0], { item: '马', count: 5, ok: true, per: 20 })
  assert.deepEqual(p[1], { item: '牛', count: 4, ok: true, per: 25 })
  assert.equal(previewItems(options, '1', ['马'], 100.01)[0].ok, false)
  assert.equal(previewItems(options, '3', ['红波'], 170)[0].per, 10)
  assert.equal(previewItems(options, '1', ['马'], 0.1)[0].per, 0.02)
  assert.deepEqual(previewItems(options, '1', [], 100), [])
  assert.deepEqual(previewItems(options, '1', ['马'], undefined), [])
})

test('topKeys 取金额最高的几项，忽略 0', () => {
  const list = [{ name: 'a', amount: '10.00' }, { name: 'b', amount: '0.00' }, { name: 'c', amount: '30.00' }, { name: 'd', amount: '20' }]
  assert.deepEqual([...topKeys(list, 'name', 2)], ['c', 'd'])
  assert.equal(topKeys([{ name: 'x', amount: 0 }], 'name').size, 0)
})

test('formatMoney', () => {
  assert.equal(formatMoney(3), '3.00')
  assert.equal(formatMoney(null), '—')
})

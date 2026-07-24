/**
 * ============================================================================
 * tests/click-guard.test.js — Testes da "auto-cura" contra loop de cliques
 * ----------------------------------------------------------------------------
 * @author Glauco Santos
 * ----------------------------------------------------------------------------
 * (O QUE) Valida `createClickGuard`: a estrutura que impede martelar o mesmo
 *   elemento indefinidamente.
 *
 * (POR QUE) Um botao de pular REAL some apos o clique; um falso-positivo (ex.:
 *   controle de +-10s do Apple TV+) PERSISTE. O guard conta cliques por elemento
 *   e bloqueia quem passa do limite — traduzindo "persistiu = nao era pular".
 *   Testar isso isoladamente prova a defesa sem depender do DOM do player.
 *
 * (COMO) Usamos objetos simples como "elementos" (o guard so precisa de
 *   identidade de referencia via WeakMap/WeakSet, nao de um Node real).
 * ============================================================================
 */
const { createClickGuard } = require('../src/content/click-guard');

describe('createClickGuard', () => {
  test('permite clicar um elemento novo', () => {
    const guard = createClickGuard();
    const el = {};
    expect(guard.allow(el)).toBe(true);
  });

  test('bloqueia o elemento apos atingir maxClicksPerElement', () => {
    const guard = createClickGuard({ maxClicksPerElement: 2 });
    const el = {};

    expect(guard.allow(el)).toBe(true);
    guard.record(el); // 1o clique
    expect(guard.allow(el)).toBe(true);
    guard.record(el); // 2o clique -> atinge o limite
    expect(guard.allow(el)).toBe(false); // agora bloqueado (persistiu = nao era pular)
  });

  test('rastreia elementos distintos de forma independente', () => {
    const guard = createClickGuard({ maxClicksPerElement: 1 });
    const a = {};
    const b = {};

    guard.record(a); // bloqueia so o A
    expect(guard.allow(a)).toBe(false);
    expect(guard.allow(b)).toBe(true); // B continua liberado
  });

  test('usa um limite padrao sensato quando nao informado', () => {
    const guard = createClickGuard();
    const el = {};
    // Com o padrao (2), um unico record nao deve bloquear ainda.
    guard.record(el);
    expect(guard.allow(el)).toBe(true);
  });
});

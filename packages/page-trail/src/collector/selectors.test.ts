import { describe, expect, it } from 'vitest';

import { SELECTOR_CONTAINER, SELECTOR_CONTENT, SELECTOR_HEADING, SELECTOR_INTERACTIVE } from './selectors';

describe('SELECTOR_HEADING', () => {
    it('matches native and aria headings', () => {
        // Given
        document.body.innerHTML = `
            <h1 id="h1"></h1>
            <h2 id="h2"></h2>
            <h3 id="h3"></h3>
            <h4 id="h4"></h4>
            <h5 id="h5"></h5>
            <h6 id="h6"></h6>
            <div role="heading" id="aria-heading"></div>
            <p id="paragraph"></p>
        `;

        // When
        const ids = matchingIds(SELECTOR_HEADING);

        // Then
        expect(ids).toEqual(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'aria-heading']);
    });
});

describe('SELECTOR_CONTAINER', () => {
    it('matches native and aria containers supported by getContainerRole', () => {
        // Given
        document.body.innerHTML = `
            <article id="native-article"></article>
            <aside id="native-aside"></aside>
            <dialog id="native-dialog"></dialog>
            <figure id="native-figure"></figure>
            <footer id="native-footer"></footer>
            <form id="native-form"></form>
            <header id="native-header"></header>
            <main id="native-main"></main>
            <nav id="native-nav"></nav>
            <section id="native-section"></section>
            <search id="native-search"></search>
            <table id="native-table">
                <tbody>
                    <tr id="native-row"></tr>
                </tbody>
            </table>
            <div role="alertdialog" id="aria-alertdialog"></div>
            <div role="dialog" id="aria-dialog"></div>
            <div role="main" id="aria-main"></div>
            <div role="banner" id="aria-banner"></div>
            <div role="contentinfo" id="aria-contentinfo"></div>
            <div role="navigation" id="aria-navigation"></div>
            <div role="complementary" id="aria-complementary"></div>
            <div role="form" id="aria-form"></div>
            <div role="search" id="aria-search"></div>
            <div role="article" id="aria-article"></div>
            <div role="region" id="aria-region"></div>
            <div role="figure" id="aria-figure"></div>
            <div role="feed" id="aria-feed"></div>
            <div role="note" id="aria-note"></div>
            <div role="tabpanel" id="aria-tabpanel"></div>
            <div role="toolbar" id="aria-toolbar"></div>
            <div role="menu" id="aria-menu"></div>
            <div role="table" id="aria-table"></div>
            <div role="row" id="aria-row"></div>
        `;

        // When
        const ids = matchingIds(SELECTOR_CONTAINER);

        // Then
        expect(ids).toEqual([
            'native-article',
            'native-aside',
            'native-dialog',
            'native-figure',
            'native-footer',
            'native-form',
            'native-header',
            'native-main',
            'native-nav',
            'native-section',
            'native-search',
            'native-table',
            'native-row',
            'aria-alertdialog',
            'aria-dialog',
            'aria-main',
            'aria-banner',
            'aria-contentinfo',
            'aria-navigation',
            'aria-complementary',
            'aria-form',
            'aria-search',
            'aria-article',
            'aria-region',
            'aria-figure',
            'aria-feed',
            'aria-note',
            'aria-tabpanel',
            'aria-toolbar',
            'aria-menu',
            'aria-table',
            'aria-row',
        ]);
    });

    it('does not match unsupported aria roles', () => {
        // Given
        document.body.innerHTML = `
            <div role="button" id="interactive-button"></div>
            <div role="heading" id="heading"></div>
            <div role="none" id="none"></div>
            <div role="presentation" id="presentation"></div>
        `;

        // When
        const ids = matchingIds(SELECTOR_CONTAINER);

        // Then
        expect(ids).toEqual([]);
    });
});

describe('SELECTOR_CONTENT', () => {
    it('matches text content candidates', () => {
        // Given
        document.body.innerHTML = `
            <h1 id="heading"></h1>
            <div role="heading" id="aria-heading"></div>
            <p id="paragraph"></p>
            <li id="list-item"></li>
            <blockquote id="quote"></blockquote>
            <figcaption id="caption"></figcaption>
            <span id="span"></span>
        `;

        // When
        const ids = matchingIds(SELECTOR_CONTENT);

        // Then
        expect(ids).toEqual(['heading', 'aria-heading', 'paragraph', 'list-item', 'quote', 'caption']);
    });
});

describe('SELECTOR_INTERACTIVE', () => {
    it('matches native and aria interactive candidates scanned by the collector', () => {
        // Given
        document.body.innerHTML = `
            <button id="button"></button>
            <a href="/docs" id="link"></a>
            <input id="input" />
            <textarea id="textarea"></textarea>
            <select id="select"></select>
            <summary id="summary"></summary>
            <div role="button" id="aria-button"></div>
            <div role="link" id="aria-link"></div>
            <div role="checkbox" id="aria-checkbox"></div>
            <div role="radio" id="aria-radio"></div>
            <div role="textbox" id="aria-textbox"></div>
            <div role="combobox" id="aria-combobox"></div>
            <div role="slider" id="aria-slider"></div>
            <a id="anchor-without-href"></a>
            <div role="menu" id="aria-menu"></div>
        `;

        // When
        const ids = matchingIds(SELECTOR_INTERACTIVE);

        // Then
        expect(ids).toEqual([
            'button',
            'link',
            'input',
            'textarea',
            'select',
            'summary',
            'aria-button',
            'aria-link',
            'aria-checkbox',
            'aria-radio',
            'aria-textbox',
            'aria-combobox',
            'aria-slider',
        ]);
    });
});

function matchingIds(selector: string) {
    return Array.from(document.body.querySelectorAll(selector), (el) => el.id).filter(Boolean);
}

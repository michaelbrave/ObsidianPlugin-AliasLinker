/**
 * Obsidian Plugin: Alias Link Resolver
 * Description: Resolves alias links to their proper files in Obsidian, ensuring links are formatted as [[Filename|Alias]]
 */

import { Plugin } from 'obsidian';

export default class AliasLinkResolver extends Plugin {
    async onload() {
        console.log("Alias Link Resolver Plugin Loaded");
        
        this.registerEvent(
            this.app.metadataCache.on("resolved", () => {
                this.resolveAliasLinks();
            })
        );
        
        this.registerEvent(
            this.app.workspace.on("file-open", file => {
                this.fixBrokenLinks(file);
            })
        );
    }
    
    async resolveAliasLinks() {
        const files = this.app.vault.getMarkdownFiles();
        const metadataCache = this.app.metadataCache;

        for (const file of files) {
            const metadata = metadataCache.getFileCache(file);
            if (metadata?.frontmatter?.aliases) {
                const aliases = metadata.frontmatter.aliases;
                if (!Array.isArray(aliases)) continue;
                
                for (const alias of aliases) {
                    this.replaceAliasLinks(alias, file.basename);
                }
            }
        }
    }

    async replaceAliasLinks(alias, filename) {
        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            const content = await this.app.vault.read(file);
            const aliasRegex = new RegExp(`\\[\\[${alias}\\]\\]`, 'g');
            const updatedContent = content.replace(aliasRegex, `[[${filename}|${alias}]]`);
            
            if (content !== updatedContent) {
                await this.app.vault.modify(file, updatedContent);
            }
        }
    }

    async fixBrokenLinks(file) {
        const content = await this.app.vault.read(file);
        const linkRegex = /\[\[(.*?)\]\]/g;
        let modifiedContent = content;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const alias = match[1];
            const resolvedFile = this.findFileByAlias(alias);
            
            if (resolvedFile) {
                modifiedContent = modifiedContent.replace(`[[${alias}]]`, `[[${resolvedFile.basename}|${alias}]]`);
            }
        }

        if (content !== modifiedContent) {
            await this.app.vault.modify(file, modifiedContent);
        }
    }

    findFileByAlias(alias) {
        const files = this.app.vault.getMarkdownFiles();
        const metadataCache = this.app.metadataCache;

        for (const file of files) {
            const metadata = metadataCache.getFileCache(file);
            if (metadata?.frontmatter?.aliases) {
                const aliases = metadata.frontmatter.aliases;
                if (Array.isArray(aliases) && aliases.includes(alias)) {
                    return file;
                }
            }
        }
        return null;
    }
}

import * as fs from 'fs/promises';
import path from 'path';

const HASHNODE_API_BASE_URL = 'https://gql.hashnode.com';
const USERNAME = 'saulhl';

const main = async () => {
    // Read the original file content
    const filePath = '../README.md';
    const markdown = await readFile(filePath);

    // Proceed only if the file was read successfully
    if (markdown) {
        // Fetch latest articles
        const articles = await fetchArticles(USERNAME);

        // Generate new content
        const newContent = generateArticlesContent(articles);

        // Replace content between markers
        const START_MARKER = '<!-- ARTICLES:START -->';
        const END_MARKER = '<!-- ARTICLES:END -->';
        const updatedMarkdown = replaceContentBetweenMarkers(
            markdown,
            START_MARKER,
            END_MARKER,
            newContent
        );

        // Save the updated file
        await saveFile(filePath, updatedMarkdown);
    }
}

// Read file
const readFile = async (filePath) => {
    try {
        const absolutePath = path.resolve(import.meta.dirname, filePath);
        console.log('Reading file from:', absolutePath);
        return await fs.readFile(absolutePath, 'utf8');
    } catch (err) {
        console.error('Error reading file:', err);
        return null;
    }
}

// Fetch latest articles
const fetchArticles = async (username, numberOfPosts = 3, pageNumber = 1) => {
    let query = `
    {
        user(username: "${username}") {
            posts(pageSize: ${numberOfPosts}, page: ${pageNumber}){
                nodes{
                    title
                    publishedAt
                    brief
                    url
                    coverImage{
                        url
                    }
                }
            }
        }
    }`

    const response = await fetch(HASHNODE_API_BASE_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({ query }),
    });

    const data = await response.json();
    return data.data.user.posts.nodes.map((post) => ({
        title: post.title,
        publishedAt: new Date(post.publishedAt),
        brief: post.brief.replace('\n', '<br>').replace('\n', ' '),
        url: post.url,
        coverImage: post.coverImage.url
    }))
}

// Generate markdown from articles
const generateArticlesContent = (articles) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
        'October', 'November', 'December'];

    let markdown = [];

    // Generate the header row dynamically
    markdown.push(`| ${articles.map(article => article.title).join(' | ')} |`)
    // Generate the separator row
    markdown.push(`|${articles.map(() => '------------').join('|')}|`)
    // Generate the article card
    markdown.push(`| ${articles.map(article =>
        `![Thumbnail](${article.coverImage}) <br>\
        🗓 ${monthNames[article.publishedAt.getMonth()]} ${article.publishedAt.getDate()}, ${article.publishedAt.getFullYear()}  <br>\
        ${article.brief} <br><br>\
        [🔗 Take a look at the article](${article.url})<br><br>`).join(' | ')} |`)

    return markdown.join("\n");
}

// Generate updated markdown
const replaceContentBetweenMarkers = (markdown, startMarker, endMarker, newContent) => {
    const regex = new RegExp(`(${startMarker})([\\s\\S]*?)(${endMarker})`, 'g');
    return markdown.replace(regex, `$1\n${newContent}\n$3`);
}

// Save file
const saveFile = async (filePath, content) => {
    try {
        const absolutePath = path.resolve(import.meta.dirname, filePath);
        await fs.writeFile(absolutePath, content, 'utf8');
        console.log('File has been saved successfully!');
    } catch (err) {
        console.error('Error saving file:', err);
    }
};

main()
const express = require('express');
const csv = require('csvtojson');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();

// Custom Modules
const Playlist = require('./modules/mongooseModel').Playlist;
const fetchData = require('./modules/fetchData');

// Middlewares
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : './tmp/'
}));
app.set('view engine', 'ejs');

// Root Route
app.get('/', (req, res)=>{
    res.render('home');
});

// Route to fetch playlist data from CSV file
app.post('/', (req, res)=>{
    const finalData = [];
    if(!req.files) res.send('No File Is Choosen!')
    const info = req.body.info;
    // Extract all data from CSV file
    csv({
        noheader : false,
        headers : ['Title', 'Level', 'Language', 'Instructor', 'Quality', 'Category', 'SubCategory', 'Subject', 'Playlist_Link', 'Playlist_ID']
    })
    .fromFile(req.files.excelSheet.tempFilePath)
    .subscribe((json)=>{
        return new Promise((resolve, reject)=>{
            // Fetch and Save Details of Each Playlist One By One
            const params = { playlistId : json.Playlist_ID, nextPageToken : '' };
            (async ()=>{
                // Get Playlist Details
                let playlistDetails = await fetchData.getPlaylistDetails(json.Playlist_ID);
                if(playlistDetails.error) res.send(playlistDetails.msg)
                // Get Videos Id
                const videosId = await fetchData.getVideosId(params);
                // Get Videos Details
                const videosDetails = await fetchData.getVideosDetails(videosId);
                // Merge all videos details in playlist details
                playlistDetails.videos = videosDetails;
                // Object to save in database
                const dbData = {
                    title : json.Title,
                    level : json.Level,
                    language : json.Language,
                    instructor : json.Instructor,
                    quality : json.Quality,
                    category : json.Category,
                    subCategory : json.SubCategory,
                    subject : json.Subject,
                    playlistLink : json.Playlist_Link,
                    playlistId : json.Playlist_ID,
                    playlistDetails : playlistDetails
                };
                finalData.push(dbData);
                // Request is to only fetch data - (respond with fetched data)
                if(info == 'fetch'){
                    resolve();
                }else if(info == 'save'){
                    // Request is to fetch and save data - (save data in DB and respond with saved data)
                    // Check if playlist is present in Databse
                    const data = await Playlist.findOne({"playlistId" : json.Playlist_ID}).exec();
                    if(data){
                        // Playlist is already saved in Database - (Show message)
                        res.send("Playlist with playlist id " + json.Playlist_ID +" , is already present in Database!");
                    }else{
                        // Playlist is not on Database - (Save and respond with the same data)
                        const newPlaylist = new Playlist(dbData);
                        newPlaylist.save();
                        resolve();
                    }
                }else res.send("Something is wrong in your request! Please try again.")
            })().catch((errr)=>{
                console.log(errr);
                res.send(errr);
            });
        });
    }, (err)=>{
        console.log(err);
        res.send(err);
    }, ()=>{
        // Resolve Method
        console.log('Done');
        fs.unlinkSync(req.files.excelSheet.tempFilePath);
        res.send(finalData);
    });
});

app.listen(3000, ()=>{
    console.log('Listening on port 3000');
});
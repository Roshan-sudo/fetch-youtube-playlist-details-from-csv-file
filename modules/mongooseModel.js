const mongoose = require('mongoose');

// Connect to mongoose database
mongoose.connect('mongodb://localhost:27017/youtubeApi', {useNewUrlParser: true, useUnifiedTopology: true});

// Schema of playlists
const playlistsSchema = new mongoose.Schema({
    title : String,
    level : String,
    language : String,
    instructor : String,
    quality : String,
    category : String,
    subCategory : String,
    subject : String,
    playlistLink : String,
    playlistId : String,
    playlistDetails : {
        playlistTitle : String,
        playlistDescription : String,
        playlistThumbnail : String,
        totalVideos : Number,
        videos : [
            {
                videoId : String,
                videoURL : String,
                videoTitle : String,
                videoDescription : String,
                videoThumbnail : String,
                videoLength : String
            }
        ]
    }
});

// Export Mongoose model
module.exports.Playlist = new mongoose.model('detailedPlaylist', playlistsSchema);
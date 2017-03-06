# fileLoader
file控件，文件上传
```javascript
var file = new SetUploaderFilesPreview({
        resource: ".file",
        target: ".d1",
        num: 9,
        size: 1024 * 1024 * 4,
        allowedType: ["image"],
        allowedExtensions: ["jpg", "png"],
        multi: true,
        drag: true,
        bigView: true,
        openFileChangePos: true,
        afterFilesPosChange: function(files) {
            console.log(files)
        }
    });
    
```

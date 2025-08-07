import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Card, CardMedia } from '@mui/material';
import Image from 'next/image';
import { rootStyle } from '@/theme';

export default function InstallGuideSafariContent() {
  return (
    <Box
      sx={{
        padding: 2,
        backgroundColor: rootStyle.backgroundColor,
        fontFamily: rootStyle.mainFontFamily,
      }}
    >
      <Typography variant="h4" component="h1" sx={{
        fontFamily: rootStyle.titleFontFamily,
        color: rootStyle.elementColor,
        marginBottom: 2,
      }}>
        How to Add the App to Home Screen (Safari)
      </Typography>
      <List sx={{ listStyleType: 'decimal', pl: 4 }}>
        <ListItem sx={{ display: 'list-item', mb: 1 }}>
          <ListItemText>
            Open Safari browser on your device
          </ListItemText>
          <Card sx={{ maxWidth: '100%', mt: 1, borderRadius: '16px' }}>
            <CardMedia
              component="img"
              image="/doc/add-to-home-screen/safari/home.PNG"
              alt="App on home screen"
              sx={{ width: '100%', height: 'auto', borderRadius: '16px' }}
            />
          </Card>
        </ListItem>
        <ListItem sx={{ display: 'list-item', mb: 1 }}>
          <ListItemText>
            Tap the <Typography component="b" sx={{ fontFamily: rootStyle.mainFontFamily, fontWeight: 'bold' }}>Share</Typography> <Typography component="span" sx={{ fontSize: '1.2em' }}>
              <Image
                src="/doc/add-to-home-screen/safari/share.png"
                alt="Share icon"
                width={20}
                height={20}
                style={{ verticalAlign: 'middle' }}
              />
          </Typography> (the square icon with an upward arrow) in the bottom toolbar of the browser.
          </ListItemText>
        </ListItem>
        <ListItem sx={{ display: 'list-item', mb: 1 }}>
          <ListItemText>
            Scroll down and select <Typography component="b" sx={{ fontFamily: rootStyle.mainFontFamily, fontWeight: 'bold' }}>Add to Home Screen</Typography>.
          </ListItemText>
          <Card sx={{ maxWidth: '100%', mt: 1, borderRadius: '16px' }}>
            <CardMedia
              component="img"
              image="/doc/add-to-home-screen/safari/open-option.PNG"
              alt="Share button on Safari"
              sx={{ width: '100%', height: 'auto', borderRadius: '16px' }}
            />
          </Card>
        </ListItem>
        <ListItem sx={{ display: 'list-item', mb: 1 }}>
          <ListItemText>
            {"If you don't see this option, scroll down and select"} <Typography component="b" sx={{ fontFamily: rootStyle.mainFontFamily, fontWeight: 'bold' }}>Edit Actions</Typography>, then add <Typography component="b" sx={{ fontFamily: rootStyle.mainFontFamily, fontWeight: 'bold' }}>Add to Home Screen</Typography>.
          </ListItemText>
          <Card sx={{ maxWidth: '100%', mt: 1, borderRadius: '16px' }}>
            <CardMedia
              component="img"
              image="/doc/add-to-home-screen/safari/custom-option-if-non-see.PNG"
              alt="Edit Actions to add option"
              sx={{ width: '100%', height: 'auto', borderRadius: '16px' }}
            />
          </Card>
          <Card sx={{ maxWidth: '100%', mt: 1, borderRadius: '16px' }}>
            <CardMedia
              component="img"
              image="/doc/add-to-home-screen/safari/custom-option-add-action.PNG"
              alt="Add to Home Screen option"
              sx={{ width: '100%', height: 'auto', borderRadius: '16px' }}
            />
          </Card>
        </ListItem>
        <ListItem sx={{ display: 'list-item', mb: 1 }}>
          <ListItemText>
            You can rename the app if you wish, then tap <Typography component="b" sx={{ fontFamily: rootStyle.mainFontFamily, fontWeight: 'bold' }}>Add</Typography> in the top right corner.
          </ListItemText>
        </ListItem>
        <ListItem sx={{ display: 'list-item', mb: 1 }}>
          <ListItemText>
            The app will appear on your home screen.
          </ListItemText>
        </ListItem>
      </List>
    </Box>
  );
}

import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";

import { getNamesFile } from "./helpers/configFiles";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];

class AutocompleteExample extends Component {
  constructor(props) {
    super(props);
    this.state = {
      films: [],
      query: ["", "", ""],
      hideResults: [true, true, true],
    };
  }

  async componentDidMount() {
    const names = await getNamesFile();
    const films = names.map((name) => {
      return {
        title: name,
      };
    });
    this.setState({
      films,
    });
  }

  findFilm(query) {
    const { films } = this.state;
    const regex = new RegExp(`${query.trim()}`, "i");
    return films.filter((film) => film.title.search(regex) >= 0);
  }

  render() {
    const { query, hideResults } = this.state;
    const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();

    const views = [];
    for (let i = 0; i < 3; i++) {
      const films = this.findFilm(query[i]);
      views.push(
        <Autocomplete
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.autocompleteContainer}
          data={
            films.length === 1 && comp(query[i], films[0].title) ? [] : films
          }
          hideResults={hideResults[i]}
          defaultValue={query[i]}
          onChangeText={(text) => {
            query[i] = text;
            this.setState({ query });
          }}
          placeholder="Enter Star Wars film title"
          renderItem={(haha) => {
            console.log(haha);
            const title = haha.item.title;
            return (
              <TouchableOpacity
                key={title}
                onPress={() => this.setState({ query: title })}
              >
                <Text style={styles.itemText}>{title}</Text>
              </TouchableOpacity>
            );
          }}
          renderTextInput={(props) => (
            <TextInput
              {...props}
              clearButtonMode="while-editing"
              onFocus={(e) => {
                props.onFocus && props.onFocus(e);
                hideResults[i] = false;
                this.setState({ hideResults });
              }}
              onBlur={(e) => {
                props.onBlur && props.onBlur(e);
                hideResults[i] = true;
                this.setState({ hideResults });
              }}
            />
          )}
          // https://github.com/mrlaessig/react-native-autocomplete-input/issues/97#issuecomment-415048170
          listStyle={{ position: "relative", maxHeight: 100 }}
        />,
      );
    }

    return (
      <View style={styles.container}>
        <Text>haha</Text>
        {views}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "red",
    marginTop: 25,
  },
  autocompleteContainer: {
    zIndex: 999,
    marginBottom: 25,
  },
  itemText: {
    fontSize: 15,
    margin: 2,
  },
});

export default AutocompleteExample;

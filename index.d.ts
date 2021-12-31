declare module 'mongoose-fuzzy-searching' {
	import {Document, Query, FilterQuery, Model, Schema} from 'mongoose';

	export interface MongooseFuzzyOptions<T> {
		fields: (T extends Object ? keyof T : string)[];
	}

	export type Search =
		| string
		| {
				query: string;
				minSize?: number;
				prefixOnly?: boolean;
				exactOnly?: boolean;
		  };

	type Callback<T, QueryHelpers> = (
		err: any,
		data: Model<T, QueryHelpers>[],
	) => void;

	type FuzzyQuery<T> = T & {
		confidenceScore: number;
	};

	export interface MongooseFuzzyModel<T extends Document, QueryHelpers = {}>
		extends Model<T, QueryHelpers> {
		fuzzySearch(
			query: Search,
			additionalQuery?: FilterQuery<T>,
			callback?: Callback<FuzzyQuery<T>, QueryHelpers>,
		): Query<FuzzyQuery<T>[], FuzzyQuery<T>, QueryHelpers>;
		fuzzySearch(
			query: Search,
			callback?: Callback<FuzzyQuery<T>, QueryHelpers>,
		): Query<FuzzyQuery<T>[], FuzzyQuery<T>, QueryHelpers>;
	}

	function fuzzyPlugin<T>(
		schema: Schema<T>,
		options: MongooseFuzzyOptions<T>,
	): void;

	export default fuzzyPlugin;
}
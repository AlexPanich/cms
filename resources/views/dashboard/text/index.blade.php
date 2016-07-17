@extends('layouts.dashboard')

@section('page_title')
    Тексты
@endsection

@section('content_title')
    Все тексты
@endsection()

@section('content')
    <?php $i = ($texts->currentPage() - 1) * 10 + 1?>
    <table class="table">
        <thead>
            <th>№</th>
            <th>Алиас</th>
            <th>Название</th>
            <th>Действия</th>
        </thead>
        <tbody>
            @foreach($texts as $text)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $text->alias }}</td>
                    <td>{{ $text->title }}</td>
                    <td>
                        <a class="btn btn-default btn-sm" href="{{ route('edit_text', $text->id) }}">Редактировать</a>
                        <a class="btn btn-danger btn-sm" href="{{ route('delete_text', $text->id) }}">Удалить</a>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    {{ $texts->render() }}
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_text') }}">Создать новый</a></p>
@endsection